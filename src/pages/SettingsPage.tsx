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
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { exportToCSV } from '../utils/exportImportUtils';
import { getDaysInMonth } from 'date-fns';

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
  
  // Salary and late penalty rule states
  const [monthlySalary, setMonthlySalary] = useState(settings.monthlySalary ?? 50000);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'Rs');
  const [lateGraceLimit, setLateGraceLimit] = useState(settings.lateGraceLimit ?? 3);
  const [latePenaltyPercent, setLatePenaltyPercent] = useState(settings.latePenaltyPercent ?? 50);

  const daysInCurrentMonth = getDaysInMonth(new Date());
  const previewDailyRate = daysInCurrentMonth > 0 && monthlySalary > 0 
    ? Number((monthlySalary / daysInCurrentMonth).toFixed(2)) 
    : 0;
  const previewHourlyRate = targetWorkingHours > 0 && previewDailyRate > 0 
    ? Number((previewDailyRate / targetWorkingHours).toFixed(2)) 
    : 0;
  const previewPenaltyPerDay = previewDailyRate > 0 
    ? Number((previewDailyRate * (latePenaltyPercent / 100)).toFixed(2)) 
    : 0;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      officeStartTime,
      targetWorkingHours: Number(targetWorkingHours),
      lunchBreakMinutes: Number(lunchBreakMinutes),
      enableNotifications,
      clockInReminderTime,
      clockOutReminderTime,
      monthlySalary: Number(monthlySalary),
      currencySymbol,
      lateGraceLimit: Number(lateGraceLimit),
      latePenaltyPercent: Number(latePenaltyPercent),
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

        {/* Salary & Late Deduction Policy Configuration */}
        <div className="oneui-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-oneui-border/60 dark:border-dark-border/60">
            <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span>Salary & Late Deduction Policy</span>
            </h3>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 w-fit">
              Active Attendance Rule
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                Monthly Salary
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(Number(e.target.value))}
                  placeholder="e.g. 50000"
                  className="w-full pl-4 pr-12 py-2.5 text-sm rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  {currencySymbol}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                Currency Symbol
              </label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold cursor-pointer"
              >
                <option value="Rs">Rs (PKR / INR)</option>
                <option value="$">$ (USD)</option>
                <option value="₹">₹ (INR)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="AED">AED (Dirham)</option>
                <option value="SAR">SAR (Riyal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                Late Grace Limit
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={lateGraceLimit}
                  onChange={(e) => setLateGraceLimit(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Days
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                Late Penalty %
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={latePenaltyPercent}
                  onChange={(e) => setLatePenaltyPercent(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  % Daily
                </span>
              </div>
            </div>
          </div>

          {/* Rule Details & Live Calculation Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent border border-amber-500/20 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-oneui-text dark:text-white">
                  3-Day Late Arrival Grace & 50% Daily Salary Deduction Rule
                </p>
                <p className="text-[11px] text-oneui-subtext dark:text-dark-subtext mt-0.5 leading-relaxed">
                  Employees have a grace allowance of <strong>{lateGraceLimit} late arrivals</strong> per month. If you are late more than 3 times, then starting on the 4th late arrival, <strong>{latePenaltyPercent}%</strong> will be deducted from that day's daily salary. Daily salary is computed based on your worked hours and the number of days in the current month ({daysInCurrentMonth} days).
                </p>
              </div>
            </div>

            {/* Live Calculation Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-500/20">
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-dark-card/70 border border-oneui-border/60 dark:border-dark-border/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Month Days</p>
                <p className="text-xs font-black font-mono text-slate-900 dark:text-white">{daysInCurrentMonth} Days</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-dark-card/70 border border-oneui-border/60 dark:border-dark-border/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Daily Base Rate</p>
                <p className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {currencySymbol} {previewDailyRate.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-dark-card/70 border border-oneui-border/60 dark:border-dark-border/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Hourly Rate ({targetWorkingHours}h)</p>
                <p className="text-xs font-black font-mono text-brand-600 dark:text-brand-400">
                  {currencySymbol} {previewHourlyRate.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-dark-card/70 border border-rose-500/30 bg-rose-500/5">
                <p className="text-[10px] font-bold text-rose-500 uppercase">Penalty (Day 4+)</p>
                <p className="text-xs font-black font-mono text-rose-600 dark:text-rose-400">
                  -{currencySymbol} {previewPenaltyPerDay.toLocaleString()}
                </p>
              </div>
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
