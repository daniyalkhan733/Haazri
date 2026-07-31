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
  Scale
} from 'lucide-react';

interface DashboardPageProps {
  onNavigateToHistory: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToHistory }) => {
  const { stats, settings } = useAttendance();

  return (
    <div className="space-y-6">
      
      {/* Clock In / Clock Out Hero Card */}
      <ClockCard />

      {/* Office Flex Rules Explanatory Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-purple-500/10 border border-brand-500/20 text-slate-900 dark:text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold flex items-center gap-2">
              Office Hours & Offset Rules
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                12:30 PM Cutoff
              </span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Sunday is a regular working day (11:00 AM – 08:00 PM = 9h). Longer shifts automatically offset shorter days!
            </p>
          </div>
        </div>

        {/* Flex Balance Badge */}
        <div className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-dark-card/90 border border-slate-200/60 dark:border-dark-border/50 text-right shrink-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cumulative Net Flex</p>
          <p className={`text-sm font-black font-mono ${
            stats.netFlexBalanceHours >= 0 ? 'text-emerald-500' : 'text-amber-500'
          }`}>
            {stats.netFlexBalanceHours >= 0 ? `+${stats.netFlexBalanceHours}h Net Extra` : `${stats.netFlexBalanceHours}h Shortfall`}
          </p>
        </div>
      </div>

      {/* Streamlined Key Metric Cards Grid (6 High-Impact Cards) */}
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
          subtitle={`Target: 9h (Expected Logout: ${formatTimeDisplay(stats.expectedLogout)})`}
          icon={Timer}
          colorScheme="indigo"
        />

        {/* 3. Current Month Total */}
        <MetricCard
          title="Current Month Total"
          value={`${stats.currentMonthHours}h`}
          subtitle={`Target: ${stats.totalTargetHours}h (${stats.workingDaysTotal} shifts)`}
          icon={CalendarDays}
          colorScheme="brand"
        />

        {/* 4. Late Days Count */}
        <MetricCard
          title="Late Days Count"
          value={stats.lateDaysCount}
          subtitle={`Arrivals after ${settings.officeStartTime} PM cutoff`}
          icon={AlertCircle}
          colorScheme="amber"
        />

        {/* 5. Net Extra Hours */}
        <MetricCard
          title="Net Extra Hours"
          value={`${stats.netOvertimeHours}h`}
          subtitle={stats.coveredShortfallDaysCount > 0 ? `${stats.coveredShortfallDaysCount} short shifts offset!` : 'Hours above target'}
          icon={Zap}
          colorScheme="emerald"
        />

        {/* 6. Active Work Streak */}
        <MetricCard
          title="Current Active Streak"
          value={`${stats.currentStreak} Days`}
          subtitle={`Best Streak: ${stats.longestStreak} Days`}
          icon={Flame}
          colorScheme="purple"
        />

      </div>

      {/* Recent Activity Feed Widget */}
      <RecentActivity onViewHistory={onNavigateToHistory} />

    </div>
  );
};
