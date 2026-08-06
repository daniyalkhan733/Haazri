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
  theme: 'dark'
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

  // Live timer tick
  useEffect(() => {
    let interval: any = null;

    if (todayEntry && todayEntry.status === 'working' && todayEntry.loginTime && !todayEntry.logoutTime) {
      const loginTimestamp = new Date(todayEntry.loginTime).getTime();

      const updateTimer = () => {
        const now = new Date().getTime();
        const diffSecs = Math.floor((now - loginTimestamp) / 1000);
        setLiveTimerSeconds(diffSecs > 0 ? diffSecs : 0);
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setLiveTimerSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todayEntry]);

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
        importRecords
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
