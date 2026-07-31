import React, { useState } from 'react';
import { useAttendance } from '../contexts/AttendanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isFirebaseConfigured } from '../firebase/config';
import { 
  Settings as SettingsIcon, 
  Clock, 
  Bell, 
  Moon, 
  Sun, 
  CloudCheck, 
  HardDrive, 
  Save, 
  ShieldCheck, 
  Download, 
  FileSpreadsheet 
} from 'lucide-react';
import { exportToCSV } from '../utils/exportImportUtils';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, records } = useAttendance();
  const { theme, setTheme } = useTheme();
  const { currentUser } = useAuth();

  const [officeStartTime, setOfficeStartTime] = useState(settings.officeStartTime);
  const [targetWorkingHours, setTargetWorkingHours] = useState(settings.targetWorkingHours);
  const [lunchBreakMinutes, setLunchBreakMinutes] = useState(settings.lunchBreakMinutes);
  const [enableNotifications, setEnableNotifications] = useState(settings.enableNotifications);
  const [clockInReminderTime, setClockInReminderTime] = useState(settings.clockInReminderTime);
  const [clockOutReminderTime, setClockOutReminderTime] = useState(settings.clockOutReminderTime);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      officeStartTime,
      targetWorkingHours: Number(targetWorkingHours),
      lunchBreakMinutes: Number(lunchBreakMinutes),
      enableNotifications,
      clockInReminderTime,
      clockOutReminderTime,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-500">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Application Settings & Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize office shift parameters, notification reminders, and theme
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Office Hours Configuration */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 pb-3 border-b border-slate-200/60 dark:border-dark-border/50">
            <Clock className="w-4 h-4 text-brand-500" />
            Shift Timing & Working Hours Logic
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Late Cutoff Time (Default 12:30 PM)
              </label>
              <input
                type="time"
                value={officeStartTime}
                onChange={(e) => setOfficeStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Daily Hours (e.g. 9 Hours)
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={targetWorkingHours}
                onChange={(e) => setTargetWorkingHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lunch Break (Minutes)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={lunchBreakMinutes}
                onChange={(e) => setLunchBreakMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Reminder System & Browser Notifications */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 pb-3 border-b border-slate-200/60 dark:border-dark-border/50">
            <Bell className="w-4 h-4 text-amber-500" />
            Reminder System & Browser Notifications
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Enable Daily Browser Notifications
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive browser alerts if you forget to clock in or clock out
              </p>
            </div>
            <input
              type="checkbox"
              checked={enableNotifications}
              onChange={(e) => setEnableNotifications(e.target.checked)}
              className="w-5 h-5 accent-brand-500 rounded cursor-pointer"
            />
          </div>

          {enableNotifications && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clock-In Reminder Time (Default 09:10 AM)
                </label>
                <input
                  type="time"
                  value={clockInReminderTime}
                  onChange={(e) => setClockInReminderTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clock-Out Reminder Time (Default 09:00 PM)
                </label>
                <input
                  type="time"
                  value={clockOutReminderTime}
                  onChange={(e) => setClockOutReminderTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Visual Theme Selection */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 pb-3 border-b border-slate-200/60 dark:border-dark-border/50">
            <Sun className="w-4 h-4 text-purple-500" />
            Appearance & Interface Theme
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-500/10 text-white font-bold'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark Mode (Recommended)</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-500/10 text-slate-900 font-bold'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </button>
          </div>
        </div>

        {/* Database Status & Backup */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 pb-3 border-b border-slate-200/60 dark:border-dark-border/50">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Database Synchronization & Backup
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-dark-border/30">
            <div className="flex items-center gap-2">
              {isFirebaseConfigured ? (
                <>
                  <CloudCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Firebase Realtime DB Connected</p>
                    <p className="text-[11px] text-slate-500">Realtime synchronization is active.</p>
                  </div>
                </>
              ) : (
                <>
                  <HardDrive className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Local Storage Mode Active</p>
                    <p className="text-[11px] text-slate-500">Data stored safely in browser. Add Firebase keys in .env to enable cloud sync.</p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => exportToCSV(records, 'attendance_backup.csv')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Backup CSV</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

      </form>
    </div>
  );
};
