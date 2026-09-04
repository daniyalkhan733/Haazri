import React from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatDateDisplay, formatTimeDisplay, formatDuration } from '../../utils/timeUtils';
import { Calendar, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import { AttendanceEntry } from '../../types';

interface RecentActivityProps {
  onViewHistory: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ onViewHistory }) => {
  const { records } = useAttendance();

  const sortedEntries = Object.values(records)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const getStatusBadge = (entry: AttendanceEntry) => {
    switch (entry.status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'working':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 animate-pulse">Working</span>;
      case 'late':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Late</span>;
      case 'vacation':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Vacation</span>;
      case 'half_day':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">Half Day</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">{entry.status}</span>;
    }
  };

  return (
    <div className="oneui-card p-5 sm:p-6">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-oneui-border/60 dark:border-dark-border/60">
        <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <span>Recent Activity Logs</span>
        </h3>
        <button
          onClick={onViewHistory}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-brand-500/10 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="py-8 text-center text-oneui-subtext dark:text-dark-subtext text-xs">
          No recent attendance records logged yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedEntries.map((entry) => (
            <div
              key={entry.date}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard hover:bg-oneui-border/40 dark:hover:bg-dark-border/40 border border-oneui-border/50 dark:border-dark-border/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-oneui-text dark:text-white">
                    {formatDateDisplay(entry.date)}
                  </span>
                  {getStatusBadge(entry)}
                </div>
                <div className="flex items-center gap-3 text-xs text-oneui-subtext dark:text-dark-subtext">
                  <span className="flex items-center gap-1 font-mono font-medium">
                    <Clock className="w-3 h-3 text-oneui-subtext" />
                    {formatTimeDisplay(entry.loginTime)} - {formatTimeDisplay(entry.logoutTime)}
                  </span>
                  {entry.notes && (
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MessageSquare className="w-3 h-3 text-brand-500" />
                      {entry.notes}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-oneui-text dark:text-white font-mono">
                  {formatDuration(entry.workedMinutes)}
                </span>
                {entry.overtimeMinutes > 0 && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    +{entry.overtimeMinutes}m OT
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
