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
    <header className="sticky top-0 z-30 w-full bg-oneui-card/85 dark:bg-dark-card/90 backdrop-blur-xl border-b border-oneui-border dark:border-dark-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Samsung One UI Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 via-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20 text-white font-extrabold text-xl tracking-wider shrink-0 select-none">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl text-oneui-text dark:text-white tracking-tight leading-none">
                Haazri<span className="text-brand-500 font-black">.</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20">
                ONE UI
              </span>
            </div>
            <p className="text-xs text-oneui-subtext dark:text-dark-subtext hidden sm:block font-medium">
              Smart Attendance & Work Hours Engine
            </p>
          </div>
        </div>

        {/* Realtime Samsung Clock Pill */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-xs font-medium text-oneui-text dark:text-dark-text shadow-sm">
          <Clock className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
          <span>{currentDate}</span>
          <span className="text-oneui-border dark:text-dark-border">|</span>
          <span className="font-bold font-mono text-brand-600 dark:text-brand-400">{currentTime}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Sync Status Pill Badge */}
          <div 
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-oneui-subcard dark:bg-dark-subcard text-oneui-text dark:text-dark-text border border-oneui-border dark:border-dark-border"
            title={isFirebaseConfigured ? 'Connected to Firebase Realtime DB' : 'Local Storage Mode'}
          >
            {isFirebaseConfigured ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px]">Cloud Sync</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px]">Local Mode</span>
              </>
            )}
          </div>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={onOpenShortcuts}
            className="hidden sm:flex p-2.5 rounded-full text-oneui-subtext dark:text-dark-subtext hover:bg-oneui-subcard dark:hover:bg-dark-subcard hover:text-oneui-text dark:hover:text-white transition-all active:scale-95"
            title="Keyboard Shortcuts (Press ?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Theme Toggle Pill */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full text-oneui-subtext dark:text-dark-subtext hover:bg-oneui-subcard dark:hover:bg-dark-subcard hover:text-oneui-text dark:hover:text-white transition-all active:scale-95"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* User Profile Pill */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-oneui-border dark:border-dark-border shrink-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full ring-2 ring-brand-500/20 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-oneui-text dark:text-dark-text hidden sm:inline-block max-w-[90px] truncate">
                {currentUser.name}
              </span>
              <button
                onClick={() => logout()}
                className="p-2 text-oneui-subtext hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all active:scale-95 shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
