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
      
      {/* Month Selection Control Bar */}
      <div className="glass-panel p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                Dashboard Overview — {stats.selectedMonthLabel}
              </h3>
              {stats.isCurrentMonth ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
                  Active Month
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30 shrink-0">
                  Historical Month
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden xs:block">
              Metrics and hours tracking filtered for {stats.selectedMonthLabel}
            </p>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/40 dark:border-dark-border/40">
          {!stats.isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-xs font-bold transition-colors"
            >
              Current Month
            </button>
          )}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-dark-card hover:shadow-sm transition-all"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 sm:px-3 text-xs font-extrabold text-slate-800 dark:text-slate-200">
              {stats.selectedMonthLabel}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-dark-card hover:shadow-sm transition-all"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clock In / Clock Out Hero Card */}
      <ClockCard />

      {/* Monthly Hours Tracker & Lag Meter Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        stats.netFlexBalanceHours >= 0 
          ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border-emerald-500/20' 
          : 'bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/5 border-amber-500/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-start sm:items-center gap-2">
              <span className={`p-2 rounded-xl text-white shrink-0 mt-0.5 sm:mt-0 ${
                stats.netFlexBalanceHours >= 0 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}>
                {stats.netFlexBalanceHours >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </span>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Monthly Hours Required vs Worked Tracker
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Target: {getDaysInMonthLabel(stats.selectedMonthLabel)} days × {settings.targetWorkingHours}h = {stats.totalTargetHours}h required for {stats.selectedMonthLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Hours Lagged Display */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-6 bg-white/70 dark:bg-dark-card/80 p-3 sm:p-3.5 rounded-xl border border-slate-200/50 dark:border-dark-border/50 shrink-0 text-center sm:text-left">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Required</p>
              <p className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white">
                {stats.totalTargetHours}h
              </p>
            </div>
            <div className="hidden sm:block h-7 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Worked</p>
              <p className="text-xs sm:text-sm font-black font-mono text-brand-500">
                {stats.currentMonthHours}h
              </p>
            </div>
            <div className="hidden sm:block h-7 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Balance</p>
              <p className={`text-xs sm:text-sm font-black font-mono ${
                stats.netFlexBalanceHours >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {stats.netFlexBalanceHours >= 0 
                  ? `+${stats.netOvertimeHours}h` 
                  : `-${stats.netShortfallHours}h`}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">
              Monthly Progress
            </span>
            <span className={stats.netFlexBalanceHours >= 0 ? 'text-emerald-500' : 'text-amber-500'}>
              {stats.monthProgressPercent}% ({stats.currentMonthHours}h / {stats.totalTargetHours}h)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                stats.netFlexBalanceHours >= 0 
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
        
        {/* 1. Today's Login Time */}
        <MetricCard
          title="Today's Login Time"
          value={formatTimeDisplay(stats.todayLogin)}
          subtitle={stats.todayLogin ? 'Recorded arrival' : 'Not clocked in yet'}
          icon={LogIn}
          colorScheme="brand"
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

        {/* 5. Month Net Hours Balance */}
        <MetricCard
          title="Month Hours Lagged / Surplus"
          value={stats.netFlexBalanceHours >= 0 ? `+${stats.netOvertimeHours}h Extra` : `-${stats.netShortfallHours}h Short`}
          subtitle={stats.netFlexBalanceHours >= 0 ? 'Exceeding target required hours!' : `Lagged behind ${stats.totalTargetHours}h target`}
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

