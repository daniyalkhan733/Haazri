import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatTimeDisplay, formatTimerSeconds, getSmartMessage } from '../../utils/timeUtils';
import { Play, Square, Clock, Sparkles, AlertCircle, CheckCircle2, Smile } from 'lucide-react';
import { MoodType } from '../../types';

export const ClockCard: React.FC = () => {
  const { todayEntry, liveTimerSeconds, settings, clockIn, clockOut } = useAttendance();
  const [loading, setLoading] = useState(false);

  const isClockedIn = Boolean(todayEntry && todayEntry.loginTime);
  const isClockedOut = Boolean(todayEntry && todayEntry.logoutTime && todayEntry.status === 'completed');
  const isWorking = Boolean(isClockedIn && !isClockedOut);

  const smartMessage = getSmartMessage(todayEntry, settings);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await clockIn();
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await clockOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
        isWorking ? 'bg-emerald-500' : isClockedOut ? 'bg-indigo-500' : 'bg-brand-500'
      }`} />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6 relative z-10">
        
        {/* Left Section: Status & Smart Message */}
        <div className="space-y-3 text-center lg:text-left flex-1 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-dark-border/40">
            {isWorking ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">CURRENTLY WORKING</span>
              </>
            ) : isClockedOut ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">SHIFT COMPLETED</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-bold">NOT CLOCKED IN</span>
              </>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isWorking ? (
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatTimerSeconds(liveTimerSeconds)}
                </span>
              ) : isClockedOut ? (
                'Shift Wrapped Up'
              ) : (
                'Ready to Start Today?'
              )}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 max-w-lg mx-auto lg:mx-0">
              {smartMessage}
            </p>
          </div>

          {/* Timestamps Row */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 pt-1 sm:pt-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-dark-border/30">
              <span className="text-slate-400 dark:text-slate-500">Login:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {formatTimeDisplay(todayEntry?.loginTime || null)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-dark-border/30">
              <span className="text-slate-400 dark:text-slate-500">Logout:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {formatTimeDisplay(todayEntry?.logoutTime || null)}
              </span>
            </div>

            {todayEntry?.lateMinutes ? (
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{todayEntry.lateMinutes}m Late</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Section: Large Interactive Action Button */}
        <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
          
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="group relative flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base sm:text-lg shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 w-full sm:w-auto min-w-[200px]"
            >
              <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-emerald-600">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </span>
              <span>🟢 Clock In Now</span>
            </button>
          ) : isWorking ? (
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="group relative flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-base sm:text-lg shadow-xl shadow-rose-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 w-full sm:w-auto min-w-[200px]"
            >
              <Square className="w-5 h-5 fill-current text-white" />
              <span>🔴 Clock Out Now</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-semibold border border-slate-200/60 dark:border-dark-border/40 w-full sm:w-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Completed for Today</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
