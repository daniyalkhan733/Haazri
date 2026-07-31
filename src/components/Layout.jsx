import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  History, 
  Calendar, 
  BarChart3, 
  Settings, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Clock,
  Cloud,
  CloudOff,
  CloudLightning,
  RefreshCw
} from 'lucide-react';

export default function Layout({ user, currentTab, setCurrentTab, theme, setTheme, syncStatus, children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  // Keep clock updated in real-time
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Attendance History', icon: History },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
    { id: 'analytics', label: 'Analytics & Charts', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Render cloud status badge
  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider select-none">
            <Cloud className="h-3 w-3" />
            Cloud Synced
          </div>
        );
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider select-none animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing...
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider select-none">
            <CloudLightning className="h-3 w-3" />
            Sync Offline
          </div>
        );
      case 'local':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-dark-card/85 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-dark-border/40 rounded-full text-[10px] font-bold uppercase tracking-wider select-none">
            <CloudOff className="h-3 w-3" />
            Local Cache Mode
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-dark-text flex">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-dark-card border-r border-slate-200/60 dark:border-dark-border/60 fixed h-full z-20">
        {/* Brand Logo */}
        <div className="h-16 px-6 border-b border-slate-200/60 dark:border-dark-border/60 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/10">
            <Clock className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">APEX CLOCK</span>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-200/60 dark:border-dark-border/60 flex items-center gap-3">
          <img 
            src={user?.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
            alt="Profile" 
            className="h-10 w-10 rounded-full object-cover border border-slate-100 dark:border-slate-850"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-150 truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.department}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE NAV BAR */}
      <div className="md:hidden w-full fixed top-0 bg-white dark:bg-dark-card border-b border-slate-200/60 dark:border-dark-border/60 h-16 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold">
            <Clock className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight text-base text-slate-900 dark:text-white">APEX</span>
        </div>

        <div className="flex items-center gap-2 font-semibold">
          {renderSyncBadge()}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE NAV DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-sm z-20" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="w-64 bg-white dark:bg-dark-card h-full border-r border-slate-200/60 dark:border-dark-border/60 flex flex-col p-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-2 mb-4 border-b border-slate-100 dark:border-dark-border/60">
              <img 
                src={user?.profile_image} 
                alt="Profile" 
                className="h-9 w-9 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-950 dark:text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400">{user?.department}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive 
                        ? 'bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 md:pl-64 pt-16 md:pt-0 min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white/40 dark:bg-dark-bg/40 backdrop-blur-md sticky top-0 border-b border-slate-200/40 dark:border-dark-border/40 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Personal Tracker | Hello, <span className="text-slate-950 dark:text-white font-bold">{user?.name.split(' ')[0]}</span> 👋
            </h1>
            {renderSyncBadge()}
          </div>

          <div className="flex items-center gap-6">
            {/* Real-time Clock */}
            <div className="flex items-center gap-3 px-3.5 py-1.5 bg-slate-100/50 dark:bg-dark-card/50 border border-slate-200/50 dark:border-dark-border/50 rounded-xl">
              <Clock className="h-3.5 w-3.5 text-brand-500" />
              <div className="text-right leading-none">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-150 tabular-nums">
                  {formatTime(time)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {formatDate(time)}
                </span>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-100 hover:bg-slate-200/60 dark:bg-dark-card dark:hover:bg-slate-800 border border-slate-200/40 dark:border-dark-border/40 rounded-xl text-slate-600 dark:text-slate-400 transition-all active:scale-95"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>
        </header>

        {/* MOBILE TIME BAR */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-dark-card/50 border-b border-slate-200/40 dark:border-dark-border/40 mt-16 text-xs text-slate-500">
          <span className="font-medium">{formatDate(time)}</span>
          <span className="font-semibold text-slate-900 dark:text-slate-200 tabular-nums">{formatTime(time)}</span>
        </div>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-4 md:p-8 animate-slide-up overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
