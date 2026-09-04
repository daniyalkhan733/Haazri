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
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'calendar' as NavigationTab, label: 'Calendar', icon: CalendarIcon, color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'reports' as NavigationTab, label: 'Analytics', icon: BarChart3, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'history' as NavigationTab, label: 'History Logs', icon: HistoryIcon, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: SettingsIcon, color: 'text-amber-500 bg-amber-500/10' },
  ];

  return (
    <>
      {/* Desktop Samsung One UI Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 p-4 min-h-[calc(100vh-4rem)]">
        
        {/* Live Working Timer Samsung Health Widget */}
        {todayEntry && todayEntry.status === 'working' && (
          <div className="mb-6 p-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 text-oneui-text dark:text-white shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Active Shift
              </span>
              <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
            </div>
            <div className="font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider my-1">
              {formatTimerSeconds(liveTimerSeconds)}
            </div>
            <p className="text-[11px] text-oneui-subtext dark:text-dark-subtext font-medium">
              Started at {todayEntry.loginTime ? new Date(todayEntry.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>
        )}

        {/* Navigation Items (One UI Grouped Inset) */}
        <div className="oneui-card p-2 flex-1 flex flex-col justify-between">
          <nav className="space-y-1">
            <p className="px-3 pt-2 pb-1 text-[11px] font-bold text-oneui-subtext dark:text-dark-subtext uppercase tracking-wider">
              Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-150 active:scale-95 ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'text-oneui-text dark:text-dark-text hover:bg-oneui-subcard dark:hover:bg-dark-subcard'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-white/20 text-white' : item.color
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer Target Shift Info */}
          <div className="p-3 mt-4 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/50 dark:border-dark-border/40 text-xs">
            <div className="flex items-center gap-2 text-oneui-text dark:text-dark-text font-bold">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              <span>Target 9 Hours/Day</span>
            </div>
            <p className="text-[10px] text-oneui-subtext dark:text-dark-subtext mt-0.5">
              Live Auto-Sync Active
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Samsung One UI Floating Dock Navigation */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-oneui-card/95 dark:bg-dark-card/95 backdrop-blur-xl border border-oneui-border dark:border-dark-border rounded-4xl px-3 py-2 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl text-xs transition-all duration-150 active:scale-90 ${
                isActive
                  ? 'text-brand-500 font-extrabold bg-brand-500/10'
                  : 'text-oneui-subtext dark:text-dark-subtext hover:text-oneui-text dark:hover:text-white'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30' : ''}`}>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[10px] font-semibold leading-none">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
