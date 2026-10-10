import { AttendanceEntry, AttendanceStatus, UserSettings } from '../types';
import { formatDuration, formatDateDisplay, formatTimeDisplay, calculateLateMinutes, calculateWorkedMinutes, calculateOvertimeMinutes } from './timeUtils';
import { calculateMonthSalary, formatCurrency } from './salaryUtils';
import { parseISO } from 'date-fns';

/**
 * Helper to get salary breakdown map for all entries
 */
function getSalaryBreakdownForRecords(records: Record<string, AttendanceEntry>, settings?: UserSettings) {
  if (!settings || !settings.monthlySalary) return null;
  const grouped: Record<string, Record<string, AttendanceEntry>> = {};
  Object.values(records).forEach(e => {
    if (e && e.date && e.date.length >= 7) {
      const mKey = e.date.slice(0, 7);
      if (!grouped[mKey]) grouped[mKey] = {};
      grouped[mKey][e.date] = e;
    }
  });

  const breakdownMap: Record<string, any> = {};
  Object.entries(grouped).forEach(([mKey, monthRecords]) => {
    try {
      const monthDate = parseISO(`${mKey}-01`);
      const res = calculateMonthSalary(monthRecords, settings, monthDate);
      Object.entries(res.dailyBreakdown).forEach(([dKey, item]) => {
        breakdownMap[dKey] = item;
      });
    } catch (e) {
      console.error(e);
    }
  });
  return breakdownMap;
}

/**
 * Export attendance records to CSV file
 */
export function exportToCSV(
  records: Record<string, AttendanceEntry>, 
  fileName: string = 'attendance_records.csv',
  settings?: UserSettings
) {
  const sorted = Object.values(records).sort((a, b) => b.date.localeCompare(a.date));
  const salaryMap = getSalaryBreakdownForRecords(records, settings);
  const currency = settings?.currencySymbol || 'Rs';
  
  const headers = salaryMap 
    ? ['Date', 'Login Time', 'Logout Time', 'Worked Hours', 'Late Minutes', 'Overtime Minutes', 'Status', `Daily Salary (${currency})`, `Late Penalty 50% (${currency})`, `Net Daily Salary (${currency})`, 'Late Grace / Penalty Note', 'Notes']
    : ['Date', 'Login Time', 'Logout Time', 'Worked Hours', 'Late Minutes', 'Overtime Minutes', 'Status', 'Mood', 'Notes', 'Today Work'];
  
  const rows = sorted.map(r => {
    const sInfo = salaryMap ? salaryMap[r.date] : null;
    let lateNote = '';
    if (sInfo) {
      if (sInfo.isPenalized) lateNote = `Late #${sInfo.lateIndexInMonth} (50% Penalty Applied)`;
      else if (sInfo.isGrace) lateNote = `Late #${sInfo.lateIndexInMonth} (Grace Covered)`;
      else if (sInfo.isLate) lateNote = 'Late';
      else lateNote = 'On Time';
    }

    if (salaryMap) {
      return [
        r.date,
        r.loginTime ? formatTimeDisplay(r.loginTime) : '',
        r.logoutTime ? formatTimeDisplay(r.logoutTime) : '',
        (r.workedMinutes / 60).toFixed(2),
        r.lateMinutes || 0,
        r.overtimeMinutes || 0,
        r.status,
        sInfo ? sInfo.dailySalaryEarned.toFixed(2) : '0.00',
        sInfo ? sInfo.deductionAmount.toFixed(2) : '0.00',
        sInfo ? sInfo.netDailySalary.toFixed(2) : '0.00',
        lateNote,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
    }

    return [
      r.date,
      r.loginTime ? formatTimeDisplay(r.loginTime) : '',
      r.logoutTime ? formatTimeDisplay(r.logoutTime) : '',
      (r.workedMinutes / 60).toFixed(2),
      r.lateMinutes || 0,
      r.overtimeMinutes || 0,
      r.status,
      r.mood || '',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      `"${(r.todayWork || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export attendance report to PDF using jsPDF dynamically
 */
export async function exportToPDF(
  records: Record<string, AttendanceEntry>, 
  userName: string = 'User',
  settings?: UserSettings
) {
  try {
    const { jsPDF } = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default || autoTableModule;

    const doc = new jsPDF();
    const sorted = Object.values(records).sort((a, b) => b.date.localeCompare(a.date));
    const salaryMap = getSalaryBreakdownForRecords(records, settings);
    const currency = settings?.currencySymbol || 'Rs';

    // Header Title
    doc.setFontSize(18);
    doc.setTextColor(12, 163, 235); // Brand color
    doc.text('Haazri Attendance & Salary Report', 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const subText = settings?.monthlySalary 
      ? `Generated for: ${userName} | Date: ${new Date().toLocaleDateString()} | Monthly Salary: ${formatCurrency(settings.monthlySalary, currency)} (Rule: 3 Late Grace, 50% deduction after day 3)`
      : `Generated for: ${userName} | Date: ${new Date().toLocaleDateString()}`;
    doc.text(subText, 14, 25);

    const headers = salaryMap 
      ? [['Date', 'Login', 'Logout', 'Worked', 'Status', 'Daily Salary', '50% Late Penalty', 'Net Salary', 'Rule Status']]
      : [['Date', 'Login', 'Logout', 'Worked', 'Late', 'Overtime', 'Status', 'Notes']];

    const tableData = sorted.map(r => {
      const sInfo = salaryMap ? salaryMap[r.date] : null;
      if (salaryMap && sInfo) {
        let ruleStatus = 'On Time';
        if (sInfo.isPenalized) ruleStatus = `Late #${sInfo.lateIndexInMonth} (50% Off)`;
        else if (sInfo.isGrace) ruleStatus = `Late #${sInfo.lateIndexInMonth} (Grace)`;

        return [
          r.date,
          r.loginTime ? formatTimeDisplay(r.loginTime) : '--',
          r.logoutTime ? formatTimeDisplay(r.logoutTime) : '--',
          formatDuration(r.workedMinutes),
          r.status.toUpperCase(),
          `${currency} ${sInfo.dailySalaryEarned.toFixed(2)}`,
          sInfo.deductionAmount > 0 ? `-${currency} ${sInfo.deductionAmount.toFixed(2)}` : `${currency} 0.00`,
          `${currency} ${sInfo.netDailySalary.toFixed(2)}`,
          ruleStatus
        ];
      }

      return [
        r.date,
        r.loginTime ? formatTimeDisplay(r.loginTime) : '--',
        r.logoutTime ? formatTimeDisplay(r.logoutTime) : '--',
        formatDuration(r.workedMinutes),
        r.lateMinutes ? `${r.lateMinutes}m` : '0m',
        r.overtimeMinutes ? `${r.overtimeMinutes}m` : '0m',
        r.status.toUpperCase(),
        r.notes || '-'
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: headers,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [12, 163, 235], textColor: 255 },
      styles: { fontSize: 7 }
    });

    doc.save(`Haazri_Attendance_Salary_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    alert('Failed to generate PDF. Falling back to CSV export.');
    exportToCSV(records, 'attendance_records.csv', settings);
  }
}

/**
 * Convert 12-hour time string like "11:30 AM" or "8:15 PM" into 24-hour "HH:mm"
 */
function parse12HourTime(timeStr: string): string | null {
  if (!timeStr || timeStr === '0' || timeStr.trim() === '') return null;
  const cleaned = timeStr.trim().toUpperCase();

  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Universal CSV & Google Sheets Copy-Paste Parser
 * Supports both standard CSVs and Google Sheets tabular copy-pasted data
 */
export function parseCSVImport(
  rawText: string,
  targetYearMonth: string = '2026-07',
  officeStartTime: string = '12:30'
): Partial<AttendanceEntry>[] {
  const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const parsed: Partial<AttendanceEntry>[] = [];

  // Check if first line contains month header like "July" or "July 2026"
  let yearMonth = targetYearMonth;
  const firstLine = lines[0].trim();
  if (firstLine.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)/i)) {
    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const foundMonth = monthNames.findIndex(m => firstLine.toLowerCase().includes(m));
    if (foundMonth !== -1) {
      const monthNum = (foundMonth + 1).toString().padStart(2, '0');
      const yearMatch = firstLine.match(/\b(20\d{2})\b/);
      const yearStr = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
      yearMonth = `${yearStr}-${monthNum}`;
    }
  }

  // Check for standard headers (Date, Login, Logout)
  const isHeaderRow = (rowText: string) => {
    const lower = rowText.toLowerCase();
    return lower.includes('date') || lower.includes('login') || lower.includes('logout');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || isHeaderRow(line)) continue;

    // Split line by tab or comma
    let cols = line.includes('\t') 
      ? line.split('\t').map(c => c.replace(/^"|"$/g, '').trim())
      : line.split(',').map(c => c.replace(/^"|"$/g, '').trim());

    if (cols.length === 0) continue;

    const firstCol = cols[0];
    
    // Check if first column is day of month (e.g. 1, 2, 3...) or full YYYY-MM-DD
    let fullDateStr = '';
    let dayNum = parseInt(firstCol, 10);

    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31 && !firstCol.includes('-')) {
      const dd = dayNum.toString().padStart(2, '0');
      fullDateStr = `${yearMonth}-${dd}`;
    } else if (firstCol.match(/^\d{4}-\d{2}-\d{2}$/)) {
      fullDateStr = firstCol;
    } else {
      continue; // Skip non-date rows
    }

    // Google Sheets columns format: Col A: Day, Col B: Login, Col C: Logout, Col D: Hours, Col E: Remarks
    const rawLogin = cols[1] || '';
    const rawLogout = cols[2] || '';
    const rawHours = cols[3] ? parseFloat(cols[3]) : NaN;
    const rawRemarks = cols[4] || cols[3] || '';

    const parsedLoginTime = parse12HourTime(rawLogin);
    const parsedLogoutTime = parse12HourTime(rawLogout);

    let loginIso: string | null = null;
    let logoutIso: string | null = null;

    if (parsedLoginTime) {
      loginIso = `${fullDateStr}T${parsedLoginTime}:00`;
    }
    if (parsedLogoutTime) {
      logoutIso = `${fullDateStr}T${parsedLogoutTime}:00`;
    }

    let status: AttendanceStatus = 'completed';
    const lowerRemarks = rawRemarks.toLowerCase();
    const isSundayDay = new Date(`${fullDateStr}T00:00:00`).getDay() === 0;

    // 1. Check for Absent or Zero-hour logs first
    if (
      lowerRemarks.includes('absent') ||
      rawLogin === '0' ||
      rawLogout === '0' ||
      rawHours === 0
    ) {
      status = 'absent';
      loginIso = null;
      logoutIso = null;
    } else if (lowerRemarks.includes('leave') || lowerRemarks.includes('vacation')) {
      status = 'vacation';
      loginIso = null;
      logoutIso = null;
    } else if (lowerRemarks.includes('half')) {
      status = 'half_day';
    } else if (lowerRemarks.includes('sunday') || lowerRemarks.includes('sun') || isSundayDay) {
      // Sunday Handling Rule: Sunday is a regular working day (11:00 AM - 08:00 PM = 9 hours)
      if (!loginIso) loginIso = `${fullDateStr}T11:00:00`;
      if (!logoutIso) logoutIso = `${fullDateStr}T20:00:00`;
      status = 'completed';
    } else if (!loginIso && !logoutIso) {
      status = 'absent';
    }

    // Compute worked minutes
    let workedMinutes = 0;
    if (status === 'absent' || status === 'vacation') {
      workedMinutes = 0;
      loginIso = null;
      logoutIso = null;
    } else if (!isNaN(rawHours) && rawHours > 0) {
      workedMinutes = Math.round(rawHours * 60);
    } else if (loginIso && logoutIso) {
      workedMinutes = calculateWorkedMinutes(loginIso, logoutIso);
    } else if (status === 'half_day') {
      workedMinutes = 270; // 4.5 hours
    } else if (status === 'completed') {
      workedMinutes = 540; // Default 9 hours
    }

    let lateMinutes = 0;
    let overtimeMinutes = 0;

    if (loginIso) {
      lateMinutes = calculateLateMinutes(loginIso, officeStartTime);
      if (lateMinutes > 0 && status === 'completed') {
        status = 'late';
      }
    }

    if (workedMinutes > 0) {
      overtimeMinutes = calculateOvertimeMinutes(workedMinutes, 9);
    }

    parsed.push({
      date: fullDateStr,
      loginTime: loginIso,
      logoutTime: logoutIso,
      workedMinutes,
      lateMinutes,
      overtimeMinutes,
      status,
      notes: rawRemarks,
      todayWork: rawRemarks ? `Remarks: ${rawRemarks}` : '',
      mood: '😊'
    });
  }

  return parsed;
}
