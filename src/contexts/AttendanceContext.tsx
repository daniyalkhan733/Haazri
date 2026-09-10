import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AttendanceEntry, AttendanceStats, UserSettings } from '../types';
import { useAuth } from './AuthContext';
import { 
  subscribeToAttendance, 
  clockInUser, 
  clockOutUser, 
  updateAttendanceRecord, 
  deleteAttendanceRecord, 
  batchImportAttendance 
} from '../firebase/attendanceService';
import { calculateAttendanceStats } from '../utils/analyticsUtils';
import { getTodayDateString } from '../utils/timeUtils';
import { checkDailyReminders, requestNotificationPermission } from '../utils/notificationUtils';
import { shouldAutoClockIn, shouldAutoClockOut } from '../utils/automationUtils';
import { getBrowserPosition, Coordinates } from '../utils/geoUtils';
import confetti from 'canvas-confetti';
import { addMonths, subMonths } from 'date-fns';

const SETTINGS_STORAGE_KEY = 'attendance_user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  officeStartTime: '12:30',
  targetWorkingHours: 9,
  lunchBreakMinutes: 60,
  enableNotifications: true,
  clockInReminderTime: '12:30',
  clockOutReminderTime: '21:00',
  theme: 'dark',
  autoClockInOnOpen: false,
  autoClockInWindowStart: '08:00',
  autoClockInWindowEnd: '15:00',
  autoClockOutOnTarget: false,
  autoClockOutCutoffTime: '22:00',
  enableGeofence: false,
  officeLatitude: null,
  officeLongitude: null,
  officeRadiusMeters: 200,
};

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface AttendanceContextType {
  records: Record<string, AttendanceEntry>;
  stats: AttendanceStats;
  loading: boolean;
  todayEntry: AttendanceEntry | null;
  settings: UserSettings;
  liveTimerSeconds: number;
  userCoordinates: Coordinates | null;
  selectedMonthDate: Date;
  setSelectedMonthDate: (date: Date) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  clockIn: (notes?: string) => Promise<boolean>;
  clockOut: () => Promise<boolean>;
  updateRecord: (dateStr: string, data: Partial<AttendanceEntry>) => Promise<void>;
  deleteRecord: (dateStr: string) => Promise<void>;
  importRecords: (imported: Partial<AttendanceEntry>[]) => Promise<number>;
  captureCurrentLocationAsOffice: () => Promise<boolean>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<Record<string, AttendanceEntry>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());

  // User settings state
  const [settings, setSettingsState] = useState<UserSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Live timer for currently clocked in session
  const [liveTimerSeconds, setLiveTimerSeconds] = useState<number>(0);
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [hasAttemptedAutoClockIn, setHasAttemptedAutoClockIn] = useState<boolean>(false);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your preferences have been updated successfully.'
    });
  };

  // Helper to capture current GPS coordinates as office location
  const captureCurrentLocationAsOffice = async (): Promise<boolean> => {
    addToast({
      type: 'info',
      title: 'Detecting GPS...',
      message: 'Fetching your high-accuracy current location.'
    });

    const pos = await getBrowserPosition();
    if (!pos) {
      addToast({
        type: 'error',
        title: 'Location Error',
        message: 'Could not access GPS. Please ensure location permissions are granted.'
      });
      return false;
    }

    setUserCoordinates(pos);
    updateSettings({
      officeLatitude: pos.latitude,
      officeLongitude: pos.longitude,
      enableGeofence: true
    });

    addToast({
      type: 'success',
      title: 'Office Location Saved 📍',
      message: `Set to (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}) with ${settings.officeRadiusMeters || 200}m radius.`
    });
    return true;
  };

  // Subscribe to Realtime Database or local storage records
  useEffect(() => {
    if (!currentUser) {
      setRecords({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToAttendance(currentUser.uid, (data) => {
      setRecords(data || {});
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Today entry
  const todayStr = getTodayDateString();
  const todayEntry = records[todayStr] || null;

  // Periodic Geolocation Tracking if Geofencing is enabled
  useEffect(() => {
    if (!settings.enableGeofence) return;

    let isMounted = true;
    const fetchLoc = async () => {
      const pos = await getBrowserPosition();
      if (isMounted && pos) {
        setUserCoordinates(pos);
      }
    };

    fetchLoc();
    const geoInterval = setInterval(fetchLoc, 45000); // Check every 45s

    return () => {
      isMounted = false;
      clearInterval(geoInterval);
    };
  }, [settings.enableGeofence]);

  // Live timer tick & Auto Clock-Out evaluation
  useEffect(() => {
    let interval: any = null;

    if (todayEntry && todayEntry.status === 'working' && todayEntry.loginTime && !todayEntry.logoutTime) {
      const loginTimestamp = new Date(todayEntry.loginTime).getTime();

      const updateTimer = () => {
        const now = new Date();
        const diffSecs = Math.floor((now.getTime() - loginTimestamp) / 1000);
        const currentSecs = diffSecs > 0 ? diffSecs : 0;
        setLiveTimerSeconds(currentSecs);

        // Check for Smart Auto Clock-Out
        const autoOutCheck = shouldAutoClockOut(settings, todayEntry, currentSecs, now);
        if (autoOutCheck.shouldClockOut && currentUser) {
          clockOutUser(currentUser.uid, settings, todayEntry).then((res) => {
            if (res.success) {
              addToast({
                type: 'success',
                title: '⚡ Auto Clocked Out',
                message: `Shift automatically completed: ${autoOutCheck.reason}.`
              });
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
            }
          });
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setLiveTimerSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todayEntry, settings, currentUser]);

  // Smart Auto Clock-In & URL Action triggers
  useEffect(() => {
    if (loading || !currentUser || hasAttemptedAutoClockIn) return;

    // 1. Check URL parameters for shortcut/NFC trigger (e.g. ?action=clockin or ?action=clockout)
    const urlParams = new URLSearchParams(window.location.search);
    const actionParam = urlParams.get('action');

    if (actionParam === 'clockin' && (!todayEntry || !todayEntry.loginTime)) {
      setHasAttemptedAutoClockIn(true);
      clockInUser(currentUser.uid, settings, 'Triggered via Webhook / Shortcut').then(res => {
        if (res.success) {
          addToast({
            type: 'success',
            title: '⚡ Quick Clocked In',
            message: 'Clocked in via shortcut trigger.'
          });
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
        }
      });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    } else if (actionParam === 'clockout' && todayEntry && todayEntry.status === 'working') {
      clockOutUser(currentUser.uid, settings, todayEntry).then(res => {
        if (res.success) {
          addToast({
            type: 'success',
            title: '⚡ Quick Clocked Out',
            message: 'Clocked out via shortcut trigger.'
          });
        }
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // 2. Evaluate Smart In-App / Geofence Auto Clock-In
    const autoInDecision = shouldAutoClockIn(settings, todayEntry, userCoordinates);
    if (autoInDecision.shouldClockIn) {
      setHasAttemptedAutoClockIn(true);
      clockInUser(currentUser.uid, settings, `⚡ Auto: ${autoInDecision.reason}`).then(res => {
        if (res.success) {
          addToast({
            type: 'success',
            title: '⚡ Auto Clocked In',
            message: `${autoInDecision.reason}. Have a productive day!`
          });
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
        }
      });
    }
  }, [loading, currentUser, todayEntry, settings, userCoordinates, hasAttemptedAutoClockIn]);

  // Periodic Reminder notification check
  useEffect(() => {
    if (!settings.enableNotifications) return;

    requestNotificationPermission();

    const interval = setInterval(() => {
      const hasClockedIn = Boolean(todayEntry && todayEntry.loginTime);
      const hasClockedOut = Boolean(todayEntry && todayEntry.logoutTime && todayEntry.status === 'completed');

      checkDailyReminders(
        hasClockedIn,
        hasClockedOut,
        settings.clockInReminderTime,
        settings.clockOutReminderTime
      );
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [todayEntry, settings]);

  const goToPrevMonth = () => setSelectedMonthDate(prev => subMonths(prev, 1));
  const goToNextMonth = () => setSelectedMonthDate(prev => addMonths(prev, 1));
  const goToCurrentMonth = () => setSelectedMonthDate(new Date());

  // Calculated Stats
  const stats = calculateAttendanceStats(records, settings, selectedMonthDate);

  // Clock In Action
  const clockIn = async (notes: string = ''): Promise<boolean> => {
    if (!currentUser) {
      addToast({ type: 'error', title: 'Authentication Required', message: 'Please sign in to clock in.' });
      return false;
    }

    const res = await clockInUser(currentUser.uid, settings, notes);
    if (res.success) {
      addToast({
        type: 'success',
        title: 'Clocked In 🟢',
        message: res.message
      });
      // Fire celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
      return true;
    } else {
      addToast({
        type: 'error',
        title: 'Clock In Failed',
        message: res.message
      });
      return false;
    }
  };

  // Clock Out Action
  const clockOut = async (): Promise<boolean> => {
    if (!currentUser) {
      addToast({ type: 'error', title: 'Authentication Required', message: 'Please sign in to clock out.' });
      return false;
    }

    const res = await clockOutUser(currentUser.uid, settings, todayEntry);
    if (res.success) {
      addToast({
        type: 'success',
        title: 'Clocked Out 🔴',
        message: res.message
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 }
      });
      return true;
    } else {
      addToast({
        type: 'error',
        title: 'Clock Out Failed',
        message: res.message
      });
      return false;
    }
  };

  // Manual record update
  const updateRecord = async (dateStr: string, data: Partial<AttendanceEntry>) => {
    if (!currentUser) return;
    await updateAttendanceRecord(currentUser.uid, dateStr, data, settings);
    addToast({
      type: 'success',
      title: 'Record Updated',
      message: `Attendance for ${dateStr} was saved.`
    });
  };

  // Delete record
  const deleteRecord = async (dateStr: string) => {
    if (!currentUser) return;
    await deleteAttendanceRecord(currentUser.uid, dateStr);
    addToast({
      type: 'info',
      title: 'Record Deleted',
      message: `Attendance for ${dateStr} has been removed.`
    });
  };

  // Import records
  const importRecords = async (imported: Partial<AttendanceEntry>[]): Promise<number> => {
    if (!currentUser) return 0;
    const count = await batchImportAttendance(currentUser.uid, imported, settings);
    addToast({
      type: 'success',
      title: 'Import Completed',
      message: `Successfully imported ${count} attendance records.`
    });
    return count;
  };

  return (
    <AttendanceContext.Provider
      value={{
        records,
        stats,
        loading,
        todayEntry,
        settings,
        liveTimerSeconds,
        userCoordinates,
        selectedMonthDate,
        setSelectedMonthDate,
        goToPrevMonth,
        goToNextMonth,
        goToCurrentMonth,
        toasts,
        addToast,
        removeToast,
        updateSettings,
        clockIn,
        clockOut,
        updateRecord,
        deleteRecord,
        importRecords,
        captureCurrentLocationAsOffice
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
