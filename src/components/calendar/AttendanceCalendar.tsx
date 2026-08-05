import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  parseISO 
} from 'date-fns';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatTimeDisplay, formatDuration } from '../../utils/timeUtils';
import { Modal } from '../common/Modal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Smile, Edit3, Trash2 } from 'lucide-react';
import { AttendanceEntry, AttendanceStatus, MoodType } from '../../types';

export const AttendanceCalendar: React.FC = () => {
  const { records, updateRecord, deleteRecord, settings } = useAttendance();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Selected date state for edit/view modal
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [editLoginTime, setEditLoginTime] = useState<string>('');
  const [editLogoutTime, setEditLogoutTime] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editWork, setEditWork] = useState<string>('');
  const [editMood, setEditMood] = useState<MoodType>('😊');
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('completed');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleTodayMonth = () => setCurrentMonth(new Date());

  const openDayDetails = (dateObj: Date) => {
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    setSelectedDateStr(dateStr);
    const existing = records[dateStr];

    if (existing) {
      setEditLoginTime(existing.loginTime ? format(new Date(existing.loginTime), "HH:mm") : '');
      setEditLogoutTime(existing.logoutTime ? format(new Date(existing.logoutTime), "HH:mm") : '');
      setEditNotes(existing.notes || '');
      setEditWork(existing.todayWork || '');
      setEditMood(existing.mood || '😊');
      setEditStatus(existing.status);
    } else {
      const isSunday = dateObj.getDay() === 0;
      setEditLoginTime(isSunday ? '11:00' : '09:00');
      setEditLogoutTime(isSunday ? '20:00' : '18:00');
      setEditNotes('');
      setEditWork('');
      setEditMood('😊');
      setEditStatus('completed');
    }
  };

  const handleSaveDayDetails = async () => {
    if (!selectedDateStr) return;

    let loginIso: string | null = null;
    let logoutIso: string | null = null;

    if (editLoginTime) {
      loginIso = `${selectedDateStr}T${editLoginTime}:00`;
    }
    if (editLogoutTime) {
      logoutIso = `${selectedDateStr}T${editLogoutTime}:00`;
    }

    await updateRecord(selectedDateStr, {
      loginTime: loginIso,
      logoutTime: logoutIso,
      status: editStatus,
      notes: editNotes,
      todayWork: editWork,
      mood: editMood
    });

    setSelectedDateStr(null);
  };

  const handleDeleteDayDetails = async () => {
    if (!selectedDateStr) return;
    if (confirm(`Delete attendance record for ${selectedDateStr}?`)) {
      await deleteRecord(selectedDateStr);
      setSelectedDateStr(null);
    }
  };

  const moods: MoodType[] = ['😊', '😐', '😫', '🔥', '🎉', '😴'];

  return (
    <div className="space-y-6">
      
      {/* Calendar Top Bar */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-500">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click on any day cell to view or log shift details
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTodayMonth}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" /> Present / On Time
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> Late Arrival
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500" /> Absent / Missed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-500" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500" /> Vacation / Leave
        </span>
      </div>

      {/* Calendar Days Grid */}
      <div className="glass-card overflow-hidden p-4">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Days Grid Cells */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = records[dateStr];
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayCell = isToday(day);

            let cellBg = 'bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/50';
            let borderClass = 'border-slate-200/40 dark:border-dark-border/30';
            let statusDot = null;

            if (isTodayCell) {
              borderClass = 'ring-2 ring-sky-500 border-sky-500';
            }

            if (entry) {
              if (entry.status === 'late' || (entry.lateMinutes && entry.lateMinutes > 0)) {
                cellBg = 'bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500/20';
                statusDot = <span className="w-2 h-2 rounded-full bg-amber-500" />;
              } else if (entry.status === 'absent') {
                cellBg = 'bg-rose-500/10 dark:bg-rose-500/15 hover:bg-rose-500/20';
                statusDot = <span className="w-2 h-2 rounded-full bg-rose-500" />;
              } else if (entry.status === 'vacation' || entry.status === 'half_day') {
                cellBg = 'bg-purple-500/10 dark:bg-purple-500/15 hover:bg-purple-500/20';
                statusDot = <span className="w-2 h-2 rounded-full bg-purple-500" />;
              } else if (entry.status === 'completed' || entry.status === 'present' || entry.status === 'working') {
                cellBg = 'bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20';
                statusDot = <span className="w-2 h-2 rounded-full bg-emerald-500" />;
              }
            }

            return (
              <button
                key={dateStr}
                onClick={() => openDayDetails(day)}
                className={`min-h-[85px] sm:min-h-[100px] p-2.5 rounded-2xl border ${borderClass} ${cellBg} flex flex-col justify-between text-left transition-all ${
                  !isCurrentMonth ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-bold ${
                    isTodayCell 
                      ? 'w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {statusDot}
                </div>

                {entry ? (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white font-mono truncate">
                      {formatDuration(entry.workedMinutes)}
                    </div>
                    {entry.loginTime && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate hidden sm:block">
                        {formatTimeDisplay(entry.loginTime)}
                      </div>
                    )}
                    {entry.mood && (
                      <span className="text-xs">{entry.mood}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 dark:text-slate-600 hidden sm:inline">
                    No log
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Edit/View Day Details Modal */}
      {selectedDateStr && (
        <Modal
          isOpen={Boolean(selectedDateStr)}
          onClose={() => setSelectedDateStr(null)}
          title={`Attendance Log - ${selectedDateStr}`}
        >
          <div className="space-y-4">
            
            {/* Status Type Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attendance Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="completed">Completed / Present 🟢</option>
                <option value="late">Late Arrival 🟡</option>
                <option value="half_day">Half Day 🟣</option>
                <option value="vacation">Vacation / Leave 🟣</option>
                <option value="absent">Absent / Missed 🔴</option>
              </select>
            </div>

            {/* Quick Shift Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Quick Shift:</span>
              <button
                type="button"
                onClick={() => { setEditLoginTime('09:00'); setEditLogoutTime('18:00'); }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
              >
                ☀️ Standard (09:00 - 18:00)
              </button>
              <button
                type="button"
                onClick={() => { setEditLoginTime('11:00'); setEditLogoutTime('20:00'); }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                🌅 Sunday (11:00 - 20:00)
              </button>
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Login Time
                </label>
                <input
                  type="time"
                  value={editLoginTime}
                  onChange={(e) => setEditLoginTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Logout Time
                </label>
                <input
                  type="time"
                  value={editLogoutTime}
                  onChange={(e) => setEditLogoutTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Mood selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                How was your mood today?
              </label>
              <div className="flex items-center gap-2">
                {moods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEditMood(m)}
                    className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition-transform ${
                      editMood === m
                        ? 'bg-brand-500/20 ring-2 ring-brand-500 scale-110'
                        : 'bg-slate-100 dark:bg-slate-800 hover:scale-105'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Today Work */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Today's Work Summary
              </label>
              <input
                type="text"
                value={editWork}
                onChange={(e) => setEditWork(e.target.value)}
                placeholder="What did you accomplish today?"
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* General Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes & Remarks
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                placeholder="Additional remarks, reasons for late arrival, etc."
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-dark-border">
              {records[selectedDateStr] ? (
                <button
                  onClick={handleDeleteDayDetails}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Record</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDateStr(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDayDetails}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
                >
                  Save Entry
                </button>
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
