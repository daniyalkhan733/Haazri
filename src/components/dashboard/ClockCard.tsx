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
    <div className="oneui-card p-5 sm:p-7 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
        isWorking ? 'bg-emerald-500' : isClockedOut ? 'bg-indigo-500' : 'bg-brand-500'
      }`} />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left Section: Status & Smart Message */}
        <div className="space-y-3.5 text-center lg:text-left flex-1 w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-oneui-subcard dark:bg-dark-subcard text-oneui-text dark:text-dark-text border border-oneui-border dark:border-dark-border shadow-sm">
            {isWorking ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wide">ACTIVE SHIFT</span>
              </>
            ) : isClockedOut ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold tracking-wide">COMPLETED</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-extrabold tracking-wide">NOT CLOCKED IN</span>
              </>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-oneui-text dark:text-white tracking-tight">
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
            <p className="text-xs sm:text-sm font-medium text-oneui-subtext dark:text-dark-subtext mt-1.5 max-w-lg mx-auto lg:mx-0">
              {smartMessage}
            </p>
          </div>

          {/* Timestamps Inset Row */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/80 dark:border-dark-border/80">
              <span className="text-oneui-subtext dark:text-dark-subtext font-medium">Login:</span>
              <span className="font-extrabold text-oneui-text dark:text-white font-mono">
                {formatTimeDisplay(todayEntry?.loginTime || null)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/80 dark:border-dark-border/80">
              <span className="text-oneui-subtext dark:text-dark-subtext font-medium">Logout:</span>
              <span className="font-extrabold text-oneui-text dark:text-white font-mono">
                {formatTimeDisplay(todayEntry?.logoutTime || null)}
              </span>
            </div>

            {todayEntry?.lateMinutes ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{todayEntry.lateMinutes}m Late</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Section: Samsung Pill Action Button */}
        <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
          
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="oneui-pill-btn bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 text-base sm:text-lg min-w-[220px] w-full sm:w-auto"
            >
              <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </span>
              <span>Clock In Now</span>
            </button>
          ) : isWorking ? (
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="oneui-pill-btn bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 text-base sm:text-lg min-w-[220px] w-full sm:w-auto"
            >
              <Square className="w-4 h-4 fill-current text-white" />
              <span>Clock Out Now</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-oneui-subcard dark:bg-dark-subcard text-oneui-subtext dark:text-dark-subtext text-sm font-bold border border-oneui-border dark:border-dark-border w-full sm:w-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Completed for Today</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
