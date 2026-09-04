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
      
      {/* Samsung One UI Top Banner */}
      <div className="oneui-card p-5 sm:p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-oneui-text dark:text-white tracking-tight">
              Settings & Preferences
            </h2>
            <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium">
              Configure shift parameters, reminder alerts, and app appearance
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-5">
        
        {/* Office Hours Configuration */}
        <div className="oneui-card p-6 space-y-4">
          <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2.5 pb-3.5 border-b border-oneui-border/60 dark:border-dark-border/60">
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span>Shift Timings & Target Hours</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                Late Cutoff Time
              </label>
              <input
                type="time"
                value={officeStartTime}
                onChange={(e) => setOfficeStartTime(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                Target Daily Hours
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={targetWorkingHours}
                onChange={(e) => setTargetWorkingHours(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                Lunch Break (Mins)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={lunchBreakMinutes}
                onChange={(e) => setLunchBreakMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Reminder System & Browser Notifications */}
        <div className="oneui-card p-6 space-y-4">
          <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2.5 pb-3.5 border-b border-oneui-border/60 dark:border-dark-border/60">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <span>Notifications & Reminders</span>
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/60 dark:border-dark-border/60">
            <div>
              <p className="text-sm font-bold text-oneui-text dark:text-white">
                Daily Shift Notifications
              </p>
              <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium mt-0.5">
                Receive browser alerts if you forget to clock in or clock out
              </p>
            </div>
            {/* Samsung Style Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableNotifications}
                onChange={(e) => setEnableNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-sm" />
            </label>
          </div>

          {enableNotifications && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                  Clock-In Reminder Time
                </label>
                <input
                  type="time"
                  value={clockInReminderTime}
                  onChange={(e) => setClockInReminderTime(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                  Clock-Out Reminder Time
                </label>
                <input
                  type="time"
                  value={clockOutReminderTime}
                  onChange={(e) => setClockOutReminderTime(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Visual Theme Selection */}
        <div className="oneui-card p-6 space-y-4">
          <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2.5 pb-3.5 border-b border-oneui-border/60 dark:border-dark-border/60">
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <span>Appearance & Theme</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-3xl border flex items-center gap-3.5 transition-all active:scale-95 ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500 font-extrabold ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-oneui-border dark:border-dark-border bg-oneui-subcard dark:bg-dark-subcard text-oneui-subtext dark:text-dark-subtext'
              }`}
            >
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold">AMOLED Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-3xl border flex items-center gap-3.5 transition-all active:scale-95 ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 font-extrabold ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-oneui-border dark:border-dark-border bg-oneui-subcard dark:bg-dark-subcard text-oneui-subtext dark:text-dark-subtext'
              }`}
            >
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold">Porcelain Light</span>
            </button>
          </div>
        </div>

        {/* Database Status & Backup */}
        <div className="oneui-card p-6 space-y-4">
          <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2.5 pb-3.5 border-b border-oneui-border/60 dark:border-dark-border/60">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Database & Cloud Sync</span>
          </h3>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/60 dark:border-dark-border/60">
            <div className="flex items-center gap-3">
              {isFirebaseConfigured ? (
                <>
                  <CloudCheck className="w-6 h-6 text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-oneui-text dark:text-white">Firebase Realtime DB Connected</p>
                    <p className="text-[11px] text-oneui-subtext dark:text-dark-subtext">Realtime cloud synchronization is active.</p>
                  </div>
                </>
              ) : (
                <>
                  <HardDrive className="w-6 h-6 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-oneui-text dark:text-white">Local Storage Mode Active</p>
                    <p className="text-[11px] text-oneui-subtext dark:text-dark-subtext">Data stored safely in browser cache.</p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => exportToCSV(records, 'haazri_backup.csv')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 active:scale-95 transition-all"
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
            className="oneui-pill-btn bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 text-sm font-bold min-w-[180px]"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

      </form>
    </div>
  );
};
