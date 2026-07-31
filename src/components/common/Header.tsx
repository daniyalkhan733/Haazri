import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { isFirebaseConfigured } from '../../firebase/config';
import { 
  Sun, 
  Moon, 
  Keyboard, 
  LogOut, 
  User, 
  CloudCheck, 
  HardDrive, 
  LogIn,
  Clock,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  onOpenShortcuts: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcuts, onOpenAuth }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(format(now, 'hh:mm:ss a'));
      setCurrentDate(format(now, 'EEE, MMM dd'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/70 dark:bg-dark-card/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-dark-border/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/25 text-white font-black text-xl tracking-wider">
            AT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                Attendance<span className="text-brand-500">Tracker</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-500 border border-brand-500/20">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Personal Work Hours & Overtime Engine
            </p>
          </div>
        </div>

        {/* Realtime Digital Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-dark-border/40 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
          <span>{currentDate}</span>
          <span className="text-slate-400 dark:text-slate-600">|</span>
          <span className="font-semibold text-slate-900 dark:text-white font-mono">{currentTime}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Sync Status Badge */}
          <div 
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-dark-border/40"
            title={isFirebaseConfigured ? 'Connected to Firebase Realtime DB' : 'Local Storage Mode (Firebase env keys pending)'}
          >
            {isFirebaseConfigured ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Firebase Sync</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                <span>Local Mode</span>
              </>
            )}
          </div>

          {/* Keyboard Shortcut Hint Button */}
          <button
            onClick={onOpenShortcuts}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Keyboard Shortcuts (Press ?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* User Account / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-dark-border">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full ring-2 ring-brand-500/30 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline-block max-w-[100px] truncate">
                {currentUser.name}
              </span>
              <button
                onClick={() => logout()}
                className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
