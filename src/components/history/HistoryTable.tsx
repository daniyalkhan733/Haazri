import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatDateDisplay, formatTimeDisplay, formatDuration, calculateLateMinutes } from '../../utils/timeUtils';
import { exportToCSV, exportToPDF, parseCSVImport } from '../../utils/exportImportUtils';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, 
  Filter, 
  Upload, 
  Download,
  FileSpreadsheet, 
  FileText, 
  Edit3, 
  Trash2, 
  Plus, 
  Calendar, 
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { AttendanceEntry, AttendanceStatus } from '../../types';
import { format, parseISO, isValid, subMonths, addMonths, subDays, startOfMonth, endOfMonth } from 'date-fns';

type DateFilterMode = 'all' | 'month' | 'range';

export const HistoryTable: React.FC = () => {
  const { records, updateRecord, deleteRecord, importRecords, settings } = useAttendance();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');

  // Period / Date Range filter state
  const [filterMode, setFilterMode] = useState<DateFilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected date for edit modal
  const [editingDateStr, setEditingDateStr] = useState<string | null>(null);
  const [originalDateStr, setOriginalDateStr] = useState<string | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [editLogin, setEditLogin] = useState('');
  const [editLogout, setEditLogout] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('completed');

  const isSundayDate = (dateStr: string) => {
    if (!dateStr) return false;
    const d = parseISO(dateStr);
    return isValid(d) && d.getDay() === 0;
  };

  const allEntries = useMemo(() => {
    return Object.values(records).sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  // Extract all distinct months available in records + current month
  const availableMonths = useMemo(() => {
    const currentM = format(new Date(), 'yyyy-MM');
    const set = new Set<string>([currentM]);
    allEntries.forEach(e => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allEntries]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    try {
      const parsed = parseISO(`${selectedMonth}-01`);
      if (isValid(parsed)) {
        setSelectedMonth(format(subMonths(parsed, 1), 'yyyy-MM'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextMonth = () => {
    try {
      const parsed = parseISO(`${selectedMonth}-01`);
      if (isValid(parsed)) {
        setSelectedMonth(format(addMonths(parsed, 1), 'yyyy-MM'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick range preset setters
  const setRangeThisMonth = () => {
    const now = new Date();
    setFilterMode('month');
    setSelectedMonth(format(now, 'yyyy-MM'));
    setStartDate('');
    setEndDate('');
  };

  const setRangeLastMonth = () => {
    const lastM = subMonths(new Date(), 1);
    setFilterMode('month');
    setSelectedMonth(format(lastM, 'yyyy-MM'));
    setStartDate('');
    setEndDate('');
  };

  const setRangeLast30Days = () => {
    const now = new Date();
    setFilterMode('range');
    setStartDate(format(subDays(now, 30), 'yyyy-MM-dd'));
    setEndDate(format(now, 'yyyy-MM-dd'));
  };

  const setRangeLast7Days = () => {
    const now = new Date();
    setFilterMode('range');
    setStartDate(format(subDays(now, 7), 'yyyy-MM-dd'));
    setEndDate(format(now, 'yyyy-MM-dd'));
  };

  const resetAllFilters = () => {
    setFilterMode('all');
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Filter entries based on all active criteria
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      // 1. Search filter
      const matchesSearch = !searchQuery.trim() || entry.date.includes(searchQuery.trim());

      // 2. Status filter
      const isSun = isSundayDate(entry.date);
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'sunday' && isSun) ||
        entry.status === statusFilter;

      // 3. Period / Date Range filter
      let matchesPeriod = true;
      if (filterMode === 'month') {
        matchesPeriod = entry.date.startsWith(selectedMonth);
      } else if (filterMode === 'range') {
        if (startDate && entry.date < startDate) matchesPeriod = false;
        if (endDate && entry.date > endDate) matchesPeriod = false;
      }

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [allEntries, searchQuery, statusFilter, filterMode, selectedMonth, startDate, endDate]);

  // Computed summary metrics for the filtered view
  const periodStats = useMemo(() => {
    let workedMins = 0;
    let presentCount = 0;
    let absentCount = 0;
    let vacationCount = 0;
    let lateCount = 0;

    filteredEntries.forEach(entry => {
      if (entry.status === 'absent') {
        absentCount++;
      } else if (entry.status === 'vacation') {
        vacationCount++;
      } else {
        if (entry.workedMinutes > 0) {
          presentCount++;
          workedMins += entry.workedMinutes;
        }
        if (entry.lateMinutes && entry.lateMinutes > 0) {
          lateCount++;
        }
      }
    });

    const workedHours = workedMins / 60;
    const workingDays = presentCount + absentCount;
    const targetHours = workingDays * (settings.targetWorkingHours || 9);
    const balanceHours = workedHours - targetHours;

    return {
      totalLogs: filteredEntries.length,
      presentCount,
      absentCount,
      vacationCount,
      lateCount,
      workedHours: Number(workedHours.toFixed(1)),
      targetHours: Number(targetHours.toFixed(1)),
      balanceHours: Number(balanceHours.toFixed(1))
    };
  }, [filteredEntries, settings.targetWorkingHours]);

  const formatMonthTitle = (yyyyMm: string) => {
    try {
      const d = parseISO(`${yyyyMm}-01`);
      return isValid(d) ? format(d, 'MMMM yyyy') : yyyyMm;
    } catch {
      return yyyyMm;
    }
  };

  const handleOpenEdit = (entry: AttendanceEntry) => {
    setOriginalDateStr(entry.date);
    setEditingDateStr(entry.date);
    setIsNewEntry(false);
    setEditLogin(entry.loginTime ? format(new Date(entry.loginTime), "HH:mm") : '');
    setEditLogout(entry.logoutTime ? format(new Date(entry.logoutTime), "HH:mm") : '');
    setEditNotes(entry.notes || '');
    setEditStatus(entry.status);
  };

  const handleCreateNewEntry = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setOriginalDateStr(null);
    setEditingDateStr(todayStr);
    setIsNewEntry(true);
    const isSun = isSundayDate(todayStr);
    setEditLogin(isSun ? '11:00' : '09:00');
    setEditLogout(isSun ? '20:00' : '18:00');
    setEditNotes('');
    setEditStatus('completed');
  };

  const handleDateChange = (newDateStr: string) => {
    setEditingDateStr(newDateStr);
    if (isSundayDate(newDateStr)) {
      setEditLogin('11:00');
      setEditLogout('20:00');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDateStr) return;
    let loginIso: string | null = null;
    let logoutIso: string | null = null;

    if (editLogin) loginIso = `${editingDateStr}T${editLogin}:00`;
    if (editLogout) logoutIso = `${editingDateStr}T${editLogout}:00`;

    // If user modified date for an existing record, delete the old date key
    if (originalDateStr && originalDateStr !== editingDateStr) {
      await deleteRecord(originalDateStr);
    }

    await updateRecord(editingDateStr, {
      loginTime: loginIso,
      logoutTime: logoutIso,
      status: editStatus,
      notes: editNotes,
      todayWork: ''
    });

    setEditingDateStr(null);
    setOriginalDateStr(null);
  };

  const handleImportCsv = async () => {
    if (!csvRawText.trim()) return;
    const parsed = parseCSVImport(csvRawText, '2026-07', settings.officeStartTime);
    if (parsed.length > 0) {
      await importRecords(parsed);
      setCsvRawText('');
      setIsImportModalOpen(false);
    } else {
      alert('Could not parse valid records from CSV. Please check formatting.');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Period Filter Toolbar */}
      <div className="oneui-card p-4 sm:p-5 space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-oneui-text dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              <span>Attendance History Logs</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                {filteredEntries.length} Records
              </span>
            </h3>
            <p className="text-xs text-oneui-subtext dark:text-dark-subtext">
              Filter by month, custom date range, or audit punctuality and pace
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCreateNewEntry}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Sheets</span>
            </button>

            <button
              onClick={() => exportToCSV(records)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => exportToPDF(records, currentUser?.name)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-xs font-bold transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Period & Range Filter Section */}
        <div className="p-3.5 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/60 dark:border-dark-border/60 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Filter Mode Selector Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'month'
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📅 Month View
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('range')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'range'
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📆 Date Range
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🌐 All Time
              </button>
            </div>

            {/* Quick Presets Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={setRangeThisMonth}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-200/60 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={setRangeLastMonth}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-200/60 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={setRangeLast30Days}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-200/60 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={setRangeLast7Days}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-200/60 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
              >
                Last 7 Days
              </button>
              {(filterMode !== 'all' || searchQuery || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Month Mode Controls */}
          {filterMode === 'month' && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-0 focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthTitle(m)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Date Range Mode Controls */}
          {filterMode === 'range' && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Filtered Period Live Summary Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Logs</p>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white">{periodStats.totalLogs}</p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Attended</p>
            <p className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{periodStats.presentCount} days</p>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</p>
            <p className="text-base font-black font-mono text-rose-600 dark:text-rose-400">{periodStats.absentCount} days</p>
          </div>

          <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20">
            <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Worked Hours</p>
            <p className="text-base font-black font-mono text-brand-600 dark:text-brand-400">{periodStats.workedHours}h</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Hours</p>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white">{periodStats.targetHours}h</p>
          </div>

          <div className={`p-3 rounded-2xl border ${
            periodStats.balanceHours > 0 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : periodStats.balanceHours < 0
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider">Lag / Lead</p>
            <p className="text-base font-black font-mono">
              {periodStats.balanceHours > 0 
                ? `+${periodStats.balanceHours}h Lead` 
                : periodStats.balanceHours < 0 
                  ? `${periodStats.balanceHours}h Lag` 
                  : '0.0h'}
            </p>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-oneui-border/60 dark:border-dark-border/60">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-oneui-subtext absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by date (YYYY-MM-DD) or day... (Press /)"
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white placeholder-oneui-subtext focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-oneui-subtext shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2.5 text-xs rounded-full bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed 🟢</option>
              <option value="sunday">Sunday 🌅</option>
              <option value="late">Late Arrival 🟡</option>
              <option value="half_day">Half Day 🟣</option>
              <option value="vacation">Vacation 🟣</option>
              <option value="absent">Absent 🔴</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="oneui-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-dark-border/50 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Login</th>
                <th className="py-3 px-4">Logout</th>
                <th className="py-3 px-4">Worked</th>
                <th className="py-3 px-4">Punctuality</th>
                <th className="py-3 px-4">Lag / Lead</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border/40 text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isAbsent = entry.status === 'absent';
                  const isVacation = entry.status === 'vacation';
                  const isHalfDay = entry.status === 'half_day';
                  const isSunday = isSundayDate(entry.date) || (entry.notes || '').toLowerCase().includes('sunday');
                  const actualLateMins = entry.loginTime 
                    ? calculateLateMinutes(entry.loginTime, isSunday ? '11:00' : settings.officeStartTime)
                    : 0;

                  return (
                    <tr 
                      key={entry.date}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        isAbsent 
                          ? 'bg-rose-500/[0.04]' 
                          : isSunday 
                            ? 'bg-amber-500/[0.04]' 
                            : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{formatDateDisplay(entry.date)}</span>
                          {isSunday && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Sun
                            </span>
                          )}
                          {isAbsent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              Absent
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {isAbsent || isVacation ? '--:--' : formatTimeDisplay(entry.loginTime)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {isAbsent || isVacation ? '--:--' : formatTimeDisplay(entry.logoutTime)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {isAbsent ? (
                          <span className="text-rose-500 dark:text-rose-400">0.0h</span>
                        ) : isVacation ? (
                          <span className="text-purple-500 dark:text-purple-400">0.0h</span>
                        ) : (
                          <span className="text-slate-900 dark:text-white">{(entry.workedMinutes / 60).toFixed(1)}h</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isAbsent ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Absent (-{settings.targetWorkingHours}h)
                          </span>
                        ) : isVacation ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Vacation / Leave
                          </span>
                        ) : isHalfDay ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Half Day
                          </span>
                        ) : isSunday ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                            <span>🌅</span>
                            <span>Sunday</span>
                          </span>
                        ) : actualLateMins > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {actualLateMins}m Late
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            On Time 🟢
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        {(() => {
                          if (isAbsent) {
                            return (
                              <span className="text-rose-500 dark:text-rose-400 font-bold">
                                -{settings.targetWorkingHours}.0h Lag
                              </span>
                            );
                          }
                          if (isVacation) {
                            return <span className="text-slate-400">-</span>;
                          }
                          const targetMins = Math.round((settings.targetWorkingHours || 9) * 60);
                          const diffMins = (entry.workedMinutes || 0) - targetMins;

                          if (diffMins > 0) {
                            const hours = Math.floor(diffMins / 60);
                            const mins = diffMins % 60;
                            const str = hours > 0 ? (mins > 0 ? `+${hours}h ${mins}m` : `+${hours}.0h`) : `+${mins}m`;
                            return (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                {str} Lead
                              </span>
                            );
                          } else if (diffMins < 0) {
                            const absMins = Math.abs(diffMins);
                            const hours = Math.floor(absMins / 60);
                            const mins = absMins % 60;
                            const str = hours > 0 ? (mins > 0 ? `-${hours}h ${mins}m` : `-${hours}.0h`) : `-${mins}m`;
                            return (
                              <span className="text-rose-500 dark:text-rose-400 font-bold">
                                {str} Lag
                              </span>
                            );
                          } else {
                            return <span className="text-slate-400 font-normal">0.0h</span>;
                          }
                        })()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRecord(entry.date)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Entry Modal */}
      {editingDateStr && (
        <Modal
          isOpen={Boolean(editingDateStr)}
          onClose={() => { setEditingDateStr(null); setOriginalDateStr(null); }}
          title={isNewEntry ? `Create Manual Shift Entry` : `Edit Shift Entry - ${editingDateStr}`}
        >
          <div className="space-y-4">
            
            {/* Target Date Selector Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date (Select date to log or backfill missing days)
              </label>
              <input
                type="date"
                value={editingDateStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {isSundayDate(editingDateStr) && (
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  🌅 Sunday detected: Default shift 11:00 AM – 08:00 PM (9h).
                </p>
              )}
            </div>

            {/* Quick 1-Click Status & Preset Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quick Presets
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Regular Day */}
                <button
                  type="button"
                  onClick={() => {
                    const [hStr, mStr] = (settings.officeStartTime || '12:30').split(':');
                    const startH = parseInt(hStr || '12', 10);
                    const startM = parseInt(mStr || '30', 10);
                    const totalEndMins = startH * 60 + startM + Math.round((settings.targetWorkingHours || 9) * 60);
                    const endH = Math.floor((totalEndMins / 60) % 24).toString().padStart(2, '0');
                    const endM = (totalEndMins % 60).toString().padStart(2, '0');
                    const loginStr = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
                    const logoutStr = `${endH}:${endM}`;
                    
                    setEditStatus('completed');
                    setEditLogin(loginStr);
                    setEditLogout(logoutStr);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    editStatus === 'completed' && editLogin !== '11:00'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>💼 Regular ({settings.targetWorkingHours}h)</span>
                  <span className="text-[10px] font-mono font-normal">
                    {settings.officeStartTime || '12:30'} - Auto
                  </span>
                </button>

                {/* 2. Sunday */}
                <button
                  type="button"
                  onClick={() => {
                    setEditStatus('completed');
                    setEditLogin('11:00');
                    setEditLogout('20:00');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    editStatus === 'completed' && editLogin === '11:00'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>🌅 Sunday (9h)</span>
                  <span className="text-[10px] font-mono font-normal">11:00 - 20:00</span>
                </button>

                {/* 3. Absent */}
                <button
                  type="button"
                  onClick={() => {
                    setEditStatus('absent');
                    setEditLogin('');
                    setEditLogout('');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    editStatus === 'absent'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>🔴 Absent</span>
                  <span className="text-[10px] font-mono font-normal">0h (-{settings.targetWorkingHours}h deficit)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Selection
              </label>
              <select
                value={editStatus}
                onChange={(e) => {
                  const newStatus = e.target.value as AttendanceStatus;
                  setEditStatus(newStatus);
                  if (newStatus === 'absent' || newStatus === 'vacation') {
                    setEditLogin('');
                    setEditLogout('');
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="completed">Present / Completed Shift 🟢</option>
                <option value="late">Late Arrival 🟡</option>
                <option value="half_day">Half Day (4.5h) 🟣</option>
                <option value="vacation">Vacation / Approved Leave 🏖️</option>
                <option value="absent">Absent (0h / -9h deficit) 🔴</option>
              </select>
            </div>

            {/* Absent Alert Banner */}
            {editStatus === 'absent' && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  🔴 Marked as Absent
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Worked hours will be <strong>0.0 hrs</strong>. This day will be counted as a working day with a <strong>-{settings.targetWorkingHours}.0 hrs shortfall</strong> in your shift pace balance.
                </p>
              </div>
            )}

            {/* Vacation Alert Banner */}
            {editStatus === 'vacation' && (
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  🏖️ Marked as Vacation / Approved Leave
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  0.0 hours worked. Vacation days are exempt from shift pace target calculations.
                </p>
              </div>
            )}

            {editStatus !== 'absent' && editStatus !== 'vacation' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Login Time
                  </label>
                  <input
                    type="time"
                    value={editLogin}
                    onChange={(e) => setEditLogin(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Logout Time
                  </label>
                  <input
                    type="time"
                    value={editLogout}
                    onChange={(e) => setEditLogout(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setEditingDateStr(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
              >
                Save Record
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CSV & Google Sheets Import Modal */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Attendance Data (Google Sheets / CSV)"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                Supports Direct Copy-Paste from Google Sheets!
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                You can select rows in your Google Sheet (with columns: Day, Login, Logout, Hours, Remarks), press <kbd className="px-1 rounded bg-slate-200 dark:bg-slate-700 font-mono">Ctrl+C</kbd>, and paste directly below!
              </p>
            </div>

            <textarea
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              rows={9}
              placeholder="Paste Google Sheets rows or CSV text here...&#10;&#10;Example (Google Sheets format):&#10;July&#10;1	11:30 AM	8:15 PM	8.75&#10;2	11:10 AM	8:00 PM	8.83&#10;6	0	0	0.00	Leave"
              className="w-full p-3 font-mono text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-dark-border">
              <span className="text-[11px] text-slate-400">
                Auto-calculates worked & overtime minutes
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportCsv}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
                >
                  Import Month Data
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
