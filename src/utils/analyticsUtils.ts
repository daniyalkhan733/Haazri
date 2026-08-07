import { AttendanceEntry, AttendanceStats, UserSettings } from '../types';
import { parseISO, format, isSameMonth, subDays, differenceInCalendarDays, parse, getDaysInMonth } from 'date-fns';
import { calculateLateMinutes } from './timeUtils';

export function calculateAttendanceStats(
  records: Record<string, AttendanceEntry>,
  settings: UserSettings,
  selectedMonthDate: Date = new Date()
): AttendanceStats {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = records[todayStr] || null;

  const entries = Object.values(records).filter(e => e && e.date);
  const targetDate = selectedMonthDate || new Date();
  
  // Month-scoped entries for selected month
  const currentMonthEntries = entries.filter(e => {
    const entryDate = parseISO(e.date);
    return isSameMonth(entryDate, targetDate);
  });

  // Today stats
  const todayLogin = todayEntry?.loginTime || null;
  const todayLogout = todayEntry?.logoutTime || null;
  const todayWorkedMinutes = todayEntry?.workedMinutes || 0;

  let expectedLogout: string | null = null;
  if (todayLogin) {
    const loginDate = new Date(todayLogin);
    const expected = new Date(loginDate.getTime() + settings.targetWorkingHours * 60 * 60 * 1000);
    expectedLogout = expected.toISOString();
  }

  let currentStatus: AttendanceStats['currentStatus'] = 'not_clocked_in';
  if (todayEntry) {
    currentStatus = todayEntry.status;
  }

  // Current Selected Month Worked Hours
  const currentMonthMinutes = currentMonthEntries.reduce((acc, curr) => acc + (curr.workedMinutes || 0), 0);
  const currentMonthHours = Number((currentMonthMinutes / 60).toFixed(1));

  // Valid login entries for month averages
  const validLogins = currentMonthEntries.filter(e => e.loginTime);
  let avgLoginTime = '--:--';
  if (validLogins.length > 0) {
    let totalMinutesFromMidnight = 0;
    validLogins.forEach(e => {
      const d = new Date(e.loginTime!);
      totalMinutesFromMidnight += d.getHours() * 60 + d.getMinutes();
    });
    const avgMins = Math.round(totalMinutesFromMidnight / validLogins.length);
    const avgH = Math.floor(avgMins / 60);
    const avgM = avgMins % 60;
    const period = avgH >= 12 ? 'PM' : 'AM';
    const displayH = avgH % 12 === 0 ? 12 : avgH % 12;
    avgLoginTime = `${displayH.toString().padStart(2, '0')}:${avgM.toString().padStart(2, '0')} ${period}`;
  }

  // Valid logout entries for month averages
  const validLogouts = currentMonthEntries.filter(e => e.logoutTime);
  let avgLogoutTime = '--:--';
  if (validLogouts.length > 0) {
    let totalMinutesFromMidnight = 0;
    validLogouts.forEach(e => {
      const d = new Date(e.logoutTime!);
      totalMinutesFromMidnight += d.getHours() * 60 + d.getMinutes();
    });
    const avgMins = Math.round(totalMinutesFromMidnight / validLogouts.length);
    const avgH = Math.floor(avgMins / 60);
    const avgM = avgMins % 60;
    const period = avgH >= 12 ? 'PM' : 'AM';
    const displayH = avgH % 12 === 0 ? 12 : avgH % 12;
    avgLogoutTime = `${displayH.toString().padStart(2, '0')}:${avgM.toString().padStart(2, '0')} ${period}`;
  }

  // Late days count for the SELECTED MONTH ONLY (Rule: ONLY logins after cutoff are Late)
  const lateDaysCount = currentMonthEntries.filter(e => {
    if (e.status === 'vacation' || e.status === 'absent') return false;
    if (e.loginTime) {
      return calculateLateMinutes(e.loginTime, settings.officeStartTime) > 0;
    }
    return false;
  }).length;

  // Work Shifts count for selected month (including Sundays as regular work days)
  const activeWorkShifts = currentMonthEntries.filter(e => e.status !== 'vacation' && e.status !== 'absent');
  const workingDaysTotal = activeWorkShifts.length;

  // SHIFT PACE CALCULATIONS (Based on number of recorded work days / shifts)
  const expectedHoursForRecordedShifts = Number((workingDaysTotal * settings.targetWorkingHours).toFixed(1));
  const shiftPaceBalanceHours = Number((currentMonthHours - expectedHoursForRecordedShifts).toFixed(1));
  const shiftPaceOvertimeHours = Math.max(0, shiftPaceBalanceHours);
  const shiftPaceShortfallHours = Math.max(0, Number((-shiftPaceBalanceHours).toFixed(1)));

  // MONTHLY TARGET & FLEX CALCULATIONS
  const daysInCurrentMonth = getDaysInMonth(targetDate);
  const totalTargetHours = Number((daysInCurrentMonth * settings.targetWorkingHours).toFixed(1));
  const totalActualHours = currentMonthHours; // Month actual hours

  // Net Flex Balance for Month = Month Worked Hours - Month Target Hours
  const netFlexBalanceHours = Number((currentMonthHours - totalTargetHours).toFixed(1));
  
  // Net Overtime & Shortfall Hours for Month
  const netOvertimeHours = Math.max(0, netFlexBalanceHours);
  const netShortfallHours = Math.max(0, Number((-netFlexBalanceHours).toFixed(1)));

  // Count days under target hours in selected month covered by flex hours
  const targetMins = settings.targetWorkingHours * 60;
  const shortDays = activeWorkShifts.filter(e => e.workedMinutes > 0 && e.workedMinutes < targetMins);
  const coveredShortfallDaysCount = netFlexBalanceHours >= 0 ? shortDays.length : 0;

  // Total Overtime Minutes in month
  const overtimeMinutesTotal = Math.round(netOvertimeHours * 60);

  // On-Time Punctuality % for Selected Month
  const onTimeShiftsCount = activeWorkShifts.filter(e => {
    const isLate = e.status === 'late' || (e.loginTime && calculateLateMinutes(e.loginTime, settings.officeStartTime) > 0);
    return !isLate;
  }).length;

  const attendancePercentage = workingDaysTotal > 0 
    ? Math.round((onTimeShiftsCount / workingDaysTotal) * 100)
    : 100;

  const missedDaysCount = currentMonthEntries.filter(e => e.status === 'absent').length;

  // Streaks calculation (across overall history)
  const { currentStreak, longestStreak } = calculateStreaks(records);

  const selectedMonthLabel = format(targetDate, 'MMMM yyyy');
  const monthProgressPercent = totalTargetHours > 0 
    ? Math.min(100, Math.round((currentMonthHours / totalTargetHours) * 100))
    : 0;
  const isCurrentMonth = isSameMonth(targetDate, new Date());

  return {
    todayLogin,
    todayLogout,
    todayWorkedMinutes,
    expectedLogout,
    currentStatus,
    currentMonthHours,
    avgLoginTime,
    avgLogoutTime,
    lateDaysCount,
    overtimeMinutesTotal,
    attendancePercentage,
    currentStreak,
    longestStreak,
    workingDaysTotal,
    missedDaysCount,
    
    // Monthly Flex Hours stats
    totalTargetHours,
    totalActualHours,
    netFlexBalanceHours,
    netOvertimeHours,
    netShortfallHours,
    coveredShortfallDaysCount,

    // Shift-Based Pace Balance
    expectedHoursForRecordedShifts,
    shiftPaceBalanceHours,
    shiftPaceOvertimeHours,
    shiftPaceShortfallHours,

    // Selected Month Metadata
    selectedMonthLabel,
    monthProgressPercent,
    isCurrentMonth,
  };
}

/**
 * Calculates current and longest streaks of present attendance
 */
export function calculateStreaks(records: Record<string, AttendanceEntry>): { currentStreak: number; longestStreak: number } {
  const dates = Object.keys(records).sort();
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  let checkDate = new Date();
  
  const todayKey = format(checkDate, 'yyyy-MM-dd');
  if (records[todayKey] && ['completed', 'working', 'present', 'late'].includes(records[todayKey].status)) {
    currentStreak++;
  }

  for (let i = 1; i <= 365; i++) {
    const prevDate = subDays(checkDate, i);
    const key = format(prevDate, 'yyyy-MM-dd');
    const entry = records[key];

    const isWeekend = prevDate.getDay() === 0 || prevDate.getDay() === 6;
    if (entry && ['completed', 'working', 'present', 'late'].includes(entry.status)) {
      currentStreak++;
    } else if (isWeekend && !entry) {
      continue;
    } else {
      break;
    }
  }

  let prevDateObj: Date | null = null;
  dates.forEach(dateStr => {
    const entry = records[dateStr];
    const entryDate = parse(dateStr, 'yyyy-MM-dd', new Date());

    if (entry && ['completed', 'working', 'present', 'late'].includes(entry.status)) {
      if (!prevDateObj) {
        tempStreak = 1;
      } else {
        const diff = differenceInCalendarDays(entryDate, prevDateObj);
        if (diff === 1 || (diff <= 3 && [0, 6].includes(prevDateObj.getDay()))) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      prevDateObj = entryDate;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      prevDateObj = null;
    }
  });

  return {
    currentStreak: Math.max(currentStreak, tempStreak),
    longestStreak: Math.max(longestStreak, currentStreak)
  };
}
