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
  Zap,
  MapPin,
  Compass,
  Terminal,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { exportToCSV } from '../utils/exportImportUtils';
import { generatePowerShellAutomationScript } from '../utils/automationUtils';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, records, captureCurrentLocationAsOffice, addToast } = useAttendance();
  const { theme, setTheme } = useTheme();
  const { currentUser } = useAuth();

  const [officeStartTime, setOfficeStartTime] = useState(settings.officeStartTime);
  const [targetWorkingHours, setTargetWorkingHours] = useState(settings.targetWorkingHours);
  const [lunchBreakMinutes, setLunchBreakMinutes] = useState(settings.lunchBreakMinutes);
  const [enableNotifications, setEnableNotifications] = useState(settings.enableNotifications);
  const [clockInReminderTime, setClockInReminderTime] = useState(settings.clockInReminderTime);
  const [clockOutReminderTime, setClockOutReminderTime] = useState(settings.clockOutReminderTime);

  // Automation & Geofencing states
  const [autoClockInOnOpen, setAutoClockInOnOpen] = useState(settings.autoClockInOnOpen ?? false);
  const [autoClockInWindowStart, setAutoClockInWindowStart] = useState(settings.autoClockInWindowStart ?? '08:00');
  const [autoClockInWindowEnd, setAutoClockInWindowEnd] = useState(settings.autoClockInWindowEnd ?? '15:00');
  const [autoClockOutOnTarget, setAutoClockOutOnTarget] = useState(settings.autoClockOutOnTarget ?? false);
  const [autoClockOutCutoffTime, setAutoClockOutCutoffTime] = useState(settings.autoClockOutCutoffTime ?? '22:00');
  const [enableGeofence, setEnableGeofence] = useState(settings.enableGeofence ?? false);
  const [officeLatitude, setOfficeLatitude] = useState(settings.officeLatitude ?? null);
  const [officeLongitude, setOfficeLongitude] = useState(settings.officeLongitude ?? null);
  const [officeRadiusMeters, setOfficeRadiusMeters] = useState(settings.officeRadiusMeters ?? 200);

  const [copiedShortcut, setCopiedShortcut] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const handleCaptureOfficeLocation = async () => {
    setCapturingLocation(true);
    try {
      const success = await captureCurrentLocationAsOffice();
      if (success) {
        // Refresh local inputs from updated settings
        setTimeout(() => {
          const updated = JSON.parse(localStorage.getItem('attendance_user_settings') || '{}');
          if (updated.officeLatitude) setOfficeLatitude(updated.officeLatitude);
          if (updated.officeLongitude) setOfficeLongitude(updated.officeLongitude);
          setEnableGeofence(true);
        }, 300);
      }
    } finally {
      setCapturingLocation(false);
    }
  };

  const handleDownloadPowerShellScript = () => {
    const scriptContent = generatePowerShellAutomationScript(currentUser?.uid || 'me');
    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'haazri_attendance.ps1';
    link.click();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Script Downloaded',
      message: 'haazri_attendance.ps1 saved. Add to Windows Task Scheduler.'
    });
  };

  const handleCopyShortcutUrl = () => {
    const shortcutUrl = `${window.location.origin}?action=clockin`;
    navigator.clipboard.writeText(shortcutUrl);
    setCopiedShortcut(true);
    addToast({
      type: 'success',
      title: 'Shortcut URL Copied',
      message: 'Paste into NFC tag, iOS Shortcut, or desktop bookmark.'
    });
    setTimeout(() => setCopiedShortcut(false), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      officeStartTime,
      targetWorkingHours: Number(targetWorkingHours),
      lunchBreakMinutes: Number(lunchBreakMinutes),
      enableNotifications,
      clockInReminderTime,
      clockOutReminderTime,
      autoClockInOnOpen,
      autoClockInWindowStart,
      autoClockInWindowEnd,
      autoClockOutOnTarget,
      autoClockOutCutoffTime,
      enableGeofence,
      officeLatitude: officeLatitude ? Number(officeLatitude) : null,
      officeLongitude: officeLongitude ? Number(officeLongitude) : null,
      officeRadiusMeters: Number(officeRadiusMeters),
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

        {/* ⚡ Smart Automation & Auto Clock-In / Out */}
        <div className="oneui-card p-6 space-y-5">
          <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center justify-between gap-2.5 pb-3.5 border-b border-oneui-border/60 dark:border-dark-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span>Smart Shift Automation</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3 h-3" />
              <span>HANDS-FREE</span>
            </span>
          </h3>

          {/* 1. Auto Clock-In on App Open / Workdays */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/60 dark:border-dark-border/60">
              <div>
                <p className="text-sm font-bold text-oneui-text dark:text-white">
                  Auto Clock-In on App Launch
                </p>
                <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium mt-0.5">
                  Automatically clock in when you open the dashboard on weekdays during your shift
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoClockInOnOpen}
                  onChange={(e) => setAutoClockInOnOpen(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-sm" />
              </label>
            </div>

            {autoClockInOnOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                <div>
                  <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                    Allowed Window Start
                  </label>
                  <input
                    type="time"
                    value={autoClockInWindowStart}
                    onChange={(e) => setAutoClockInWindowStart(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-2xl bg-white dark:bg-dark-card border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-oneui-subtext dark:text-dark-subtext mb-1.5 uppercase tracking-wider">
                    Allowed Window End
                  </label>
                  <input
                    type="time"
                    value={autoClockInWindowEnd}
                    onChange={(e) => setAutoClockInWindowEnd(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-2xl bg-white dark:bg-dark-card border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Auto Clock-Out upon Completing Target Hours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/60 dark:border-dark-border/60">
              <div>
                <p className="text-sm font-bold text-oneui-text dark:text-white">
                  Target-Hours Auto Clock-Out
                </p>
                <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium mt-0.5">
                  Automatically complete and clock out your shift once {targetWorkingHours} working hours are completed
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoClockOutOnTarget}
                  onChange={(e) => setAutoClockOutOnTarget(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-sm" />
              </label>
            </div>

            <div className="p-3.5 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/60 dark:border-dark-border/60 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-oneui-text dark:text-white uppercase tracking-wider">
                  End-of-Day Cutoff Failsafe
                </p>
                <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium mt-0.5">
                  Forces clock-out at this time if still running to prevent overnight accidental timer leaks
                </p>
              </div>
              <input
                type="time"
                value={autoClockOutCutoffTime}
                onChange={(e) => setAutoClockOutCutoffTime(e.target.value)}
                className="w-36 px-4 py-2 text-sm rounded-xl bg-white dark:bg-dark-card border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono"
              />
            </div>
          </div>

          {/* 3. Office GPS Geofencing */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/60 dark:border-dark-border/60">
              <div>
                <p className="text-sm font-bold text-oneui-text dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>Office GPS Geofencing</span>
                </p>
                <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium mt-0.5">
                  Only triggers attendance when your device is physically within your office radius
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableGeofence}
                  onChange={(e) => setEnableGeofence(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-sm" />
              </label>
            </div>

            {enableGeofence && (
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs font-mono text-oneui-text dark:text-white">
                    {officeLatitude && officeLongitude ? (
                      <span className="font-bold">
                        Coordinates: {Number(officeLatitude).toFixed(4)}°, {Number(officeLongitude).toFixed(4)}°
                      </span>
                    ) : (
                      <span className="text-amber-500 font-semibold">No office coordinates set yet</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCaptureOfficeLocation}
                    disabled={capturingLocation}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 active:scale-95 transition-all shadow-sm"
                  >
                    <Compass className={`w-3.5 h-3.5 ${capturingLocation ? 'animate-spin' : ''}`} />
                    <span>{capturingLocation ? 'Acquiring GPS...' : 'Set Current GPS as Office'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-rose-500/10">
                  <label className="text-xs font-bold text-oneui-subtext dark:text-dark-subtext uppercase tracking-wider">
                    Allowed Geofence Radius (Meters)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={2000}
                    step={25}
                    value={officeRadiusMeters}
                    onChange={(e) => setOfficeRadiusMeters(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 text-sm rounded-xl bg-white dark:bg-dark-card border border-oneui-border dark:border-dark-border text-oneui-text dark:text-white font-mono text-right"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 💻 Zero-Touch Windows OS & Shortcuts Automation */}
        <div className="oneui-card p-6 space-y-4">
          <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2.5 pb-3.5 border-b border-oneui-border/60 dark:border-dark-border/60">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <span>Zero-Touch Windows Logon & Shortcuts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Download PowerShell Script */}
            <div className="p-4 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/60 dark:border-dark-border/60 flex flex-col justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-oneui-text dark:text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-500" />
                  <span>Windows Task Scheduler Script</span>
                </p>
                <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium mt-1">
                  Runs on PC boot/logon and shutdown to clock you in/out automatically without opening browser.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadPowerShellScript}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download .ps1 Script</span>
              </button>
            </div>

            {/* Instant Shortcut / NFC URL */}
            <div className="p-4 rounded-2xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border/60 dark:border-dark-border/60 flex flex-col justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-oneui-text dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Instant URL Trigger / NFC Tag</span>
                </p>
                <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium mt-1">
                  Copy quick action URL for desk NFC stickers, iOS Shortcuts, or Android Macrodroid.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyShortcutUrl}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 active:scale-95 transition-all"
              >
                {copiedShortcut ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedShortcut ? 'Copied to Clipboard!' : 'Copy Quick-Trigger URL'}</span>
              </button>
            </div>
          </div>
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
