import React from 'react';
import { useAttendance } from '../contexts/AttendanceContext';
import { ClockCard } from '../components/dashboard/ClockCard';
import { MetricCard } from '../components/dashboard/MetricCard';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { formatTimeDisplay, formatDuration } from '../utils/timeUtils';
import { 
  Clock, 
  LogOut, 
  Timer, 
  CalendarCheck, 
  CalendarDays, 
  LogIn, 
  AlertCircle, 
  Zap, 
  Flame,
  Scale,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface DashboardPageProps {
  onNavigateToHistory: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToHistory }) => {
  const { 
    stats, 
    settings, 
    goToPrevMonth, 
    goToNextMonth, 
    goToCurrentMonth 
  } = useAttendance();

  return (
    <div className="space-y-6">
      
      {/* Samsung One UI Viewing Area Banner & Month Selector */}
      <div className="oneui-card p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-oneui-text dark:text-white tracking-tight">
                {stats.selectedMonthLabel}
              </h2>
              {stats.isCurrentMonth ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/25">
                  Current Month
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-brand-500/15 text-brand-600 dark:text-brand-400 font-extrabold border border-brand-500/25">
                  History Record
                </span>
              )}
            </div>
            <p className="text-xs text-oneui-subtext dark:text-dark-subtext mt-0.5 font-medium">
              Attendance, worked pace & monthly statistics
            </p>
          </div>
        </div>

        {/* Month Navigation Pill Group */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-oneui-border/60 dark:border-dark-border/60">
          {!stats.isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="px-3.5 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-xs font-bold transition-all active:scale-95"
            >
              Current Month
            </button>
          )}
          <div className="flex items-center bg-oneui-subcard dark:bg-dark-subcard p-1 rounded-full border border-oneui-border dark:border-dark-border shadow-sm">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-full text-oneui-text dark:text-dark-text hover:bg-white dark:hover:bg-dark-card hover:shadow-sm transition-all active:scale-90"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-extrabold text-oneui-text dark:text-white">
              {stats.selectedMonthLabel}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-full text-oneui-text dark:text-dark-text hover:bg-white dark:hover:bg-dark-card hover:shadow-sm transition-all active:scale-90"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clock In / Clock Out Hero Card */}
      <ClockCard />

      {/* Samsung Health Style Monthly Workday Pace Card */}
      <div className={`p-5 sm:p-6 rounded-squircle border transition-all ${
        stats.shiftPaceBalanceHours >= 0 
          ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20' 
          : 'bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent border-amber-500/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-start sm:items-center gap-3">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                stats.shiftPaceBalanceHours >= 0 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-amber-500 shadow-amber-500/20'
              }`}>
                {stats.shiftPaceBalanceHours >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </span>
              <div>
                <h4 className="text-base sm:text-lg font-black text-oneui-text dark:text-white">
                  Workday Pace & Hours Balance
                </h4>
                <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium mt-0.5">
                  {stats.currentMonthHours}h completed across {stats.workingDaysTotal} recorded shifts (Target: {stats.expectedHoursForRecordedShifts}h)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Pill Metrics */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-6 bg-white/80 dark:bg-dark-card/90 p-3.5 sm:p-4 rounded-2xl border border-oneui-border/80 dark:border-dark-border/80 shrink-0 text-center sm:text-left shadow-sm">
            <div>
              <p className="text-[10px] text-oneui-subtext dark:text-dark-subtext font-bold uppercase tracking-wider">Shift Target</p>
              <p className="text-xs sm:text-sm font-black font-mono text-oneui-text dark:text-white">
                {stats.expectedHoursForRecordedShifts}h
              </p>
            </div>
            <div className="hidden sm:block h-7 w-[1px] bg-oneui-border dark:bg-dark-border" />
            <div>
              <p className="text-[10px] text-oneui-subtext dark:text-dark-subtext font-bold uppercase tracking-wider">Worked</p>
              <p className="text-xs sm:text-sm font-black font-mono text-brand-500">
                {stats.currentMonthHours}h
              </p>
            </div>
            <div className="hidden sm:block h-7 w-[1px] bg-oneui-border dark:bg-dark-border" />
            <div>
              <p className="text-[10px] text-oneui-subtext dark:text-dark-subtext font-bold uppercase tracking-wider">Pace Balance</p>
              <p className={`text-xs sm:text-sm font-black font-mono ${
                stats.shiftPaceBalanceHours >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {stats.shiftPaceBalanceHours >= 0 
                  ? `+${stats.shiftPaceOvertimeHours}h` 
                  : `-${stats.shiftPaceShortfallHours}h`}
              </p>
            </div>
          </div>
        </div>

        {/* Samsung Pill Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-oneui-text dark:text-white">
              Monthly Goal Progress ({stats.workingDaysTotal} shifts)
            </span>
            <span className={stats.shiftPaceBalanceHours >= 0 ? 'text-emerald-500' : 'text-amber-500'}>
              {stats.monthProgressPercent}% ({stats.currentMonthHours}h / {stats.totalTargetHours}h total target)
            </span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-oneui-border/60 dark:bg-dark-border/60 overflow-hidden p-0.5 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                stats.shiftPaceBalanceHours >= 0 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${Math.min(100, stats.monthProgressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Month-Scoped Streamlined Key Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. Workday Hours Lag / Surplus (Replaced Today's Login Time) */}
        <MetricCard
          title="Workday Hours Lag / Surplus"
          value={stats.shiftPaceBalanceHours >= 0 ? `+${stats.shiftPaceOvertimeHours}h Extra` : `-${stats.shiftPaceShortfallHours}h Short`}
          subtitle={
            stats.shiftPaceBalanceHours >= 0 
              ? `Ahead of ${stats.expectedHoursForRecordedShifts}h target (${stats.workingDaysTotal} shifts recorded)` 
              : `Lagged behind ${stats.expectedHoursForRecordedShifts}h target (${stats.workingDaysTotal} shifts recorded)`
          }
          icon={Scale}
          colorScheme={stats.shiftPaceBalanceHours >= 0 ? 'emerald' : 'rose'}
        />

        {/* 2. Worked Hours Today */}
        <MetricCard
          title="Worked Hours Today"
          value={formatDuration(stats.todayWorkedMinutes)}
          subtitle={`Target: ${settings.targetWorkingHours}h (Expected Logout: ${formatTimeDisplay(stats.expectedLogout)})`}
          icon={Timer}
          colorScheme="indigo"
        />

        {/* 3. Month Worked Hours */}
        <MetricCard
          title={`Worked in ${stats.selectedMonthLabel}`}
          value={`${stats.currentMonthHours}h`}
          subtitle={`Required: ${stats.totalTargetHours}h (${stats.workingDaysTotal} shifts recorded)`}
          icon={CalendarDays}
          colorScheme="brand"
        />

        {/* 4. Month Late Days Count */}
        <MetricCard
          title={`Late Days (${stats.selectedMonthLabel})`}
          value={stats.lateDaysCount}
          subtitle={`Arrivals after ${settings.officeStartTime} PM in ${stats.selectedMonthLabel}`}
          icon={AlertCircle}
          colorScheme="amber"
        />

        {/* 5. Full Month Goal Lag / Lead */}
        <MetricCard
          title="Total Month Goal Lag"
          value={stats.netFlexBalanceHours >= 0 ? `+${stats.netOvertimeHours}h Extra` : `-${stats.netShortfallHours}h Short`}
          subtitle={stats.netFlexBalanceHours >= 0 ? 'Exceeding total required hours!' : `Full month goal: ${stats.totalTargetHours}h (${stats.currentMonthHours}h worked so far)`}
          icon={Zap}
          colorScheme={stats.netFlexBalanceHours >= 0 ? 'emerald' : 'rose'}
        />

        {/* 6. Month Punctuality & Streaks */}
        <MetricCard
          title={`Punctuality (${stats.selectedMonthLabel})`}
          value={`${stats.attendancePercentage}% On-Time`}
          subtitle={`Current Streak: ${stats.currentStreak} Days (Best: ${stats.longestStreak} Days)`}
          icon={Flame}
          colorScheme="purple"
        />

      </div>

      {/* Recent Activity Feed Widget */}
      <RecentActivity onViewHistory={onNavigateToHistory} />

    </div>
  );
};

// Helper helper to get number of days in the month label string
function getDaysInMonthLabel(label: string): number {
  return label.includes('February') ? 28 : (['April', 'June', 'September', 'November'].some(m => label.includes(m)) ? 30 : 31);
}

