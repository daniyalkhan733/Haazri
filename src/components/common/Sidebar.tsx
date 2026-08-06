import React from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  BarChart3, 
  History as HistoryIcon, 
  Settings as SettingsIcon,
  Clock,
  Zap
} from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatTimerSeconds } from '../../utils/timeUtils';

export type NavigationTab = 'dashboard' | 'calendar' | 'reports' | 'history' | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { todayEntry, liveTimerSeconds } = useAttendance();

  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar' as NavigationTab, label: 'Calendar', icon: CalendarIcon },
    { id: 'reports' as NavigationTab, label: 'Reports & Charts', icon: BarChart3 },
    { id: 'history' as NavigationTab, label: 'Attendance History', icon: HistoryIcon },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 p-4 border-r border-slate-200/60 dark:border-dark-border/50 bg-white/40 dark:bg-dark-card/30 backdrop-blur-md transition-colors min-h-[calc(100vh-4rem)]">
        
        {/* Live Working Timer Card Widget */}
        {todayEntry && todayEntry.status === 'working' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-brand-500/10 via-indigo-500/10 to-purple-500/10 border border-brand-500/30 text-slate-900 dark:text-white shadow-lg shadow-brand-500/5">
            <div className="flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Working Shift Live
              </span>
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-wider my-1">
              {formatTimerSeconds(liveTimerSeconds)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clocked in at {todayEntry.loginTime ? new Date(todayEntry.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5">
          <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info card */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-dark-border/50 text-xs text-slate-400 dark:text-slate-500 px-3">
          <div className="flex items-center gap-2 mb-1 text-slate-600 dark:text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            <span>Target: 9h/day</span>
          </div>
          <p className="text-[11px]">Realtime sync enabled.</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-dark-border/60 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 ${
                isActive
                  ? 'text-brand-500 font-bold bg-brand-500/10 dark:bg-brand-500/15'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-semibold leading-none">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
