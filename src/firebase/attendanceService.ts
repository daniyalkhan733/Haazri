import { ref, onValue, set, update, remove } from 'firebase/database';
import { database, isFirebaseConfigured } from './config';
import { AttendanceEntry, AttendanceStatus, UserSettings } from '../types';
import { 
  getTodayDateString, 
  calculateLateMinutes, 
  calculateWorkedMinutes, 
  calculateOvertimeMinutes 
} from '../utils/timeUtils';

const LOCAL_ATTENDANCE_KEY = 'attendance_records_store';

// Helper to load local records
function getLocalRecords(): Record<string, AttendanceEntry> {
  const saved = localStorage.getItem(LOCAL_ATTENDANCE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local attendance records:', e);
    }
  }
  return {};
}

// Helper to save local records
function saveLocalRecords(records: Record<string, AttendanceEntry>) {
  localStorage.setItem(LOCAL_ATTENDANCE_KEY, JSON.stringify(records));
}

/**
 * Realtime Database listener for attendance records using onValue()
 */
export function subscribeToAttendance(
  uid: string,
  callback: (records: Record<string, AttendanceEntry>) => void
): () => void {
  if (database && isFirebaseConfigured && uid) {
    const attendanceRef = ref(database, `attendance/${uid}`);
    const unsubscribe = onValue(
      attendanceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val() as Record<string, AttendanceEntry>;
          callback(val);
        } else {
          callback({});
        }
      },
      (error) => {
        console.error('Realtime Database listener error:', error);
        callback(getLocalRecords());
      }
    );
    return unsubscribe;
  } else {
    // Local storage fallback mode with interval sync simulation
    callback(getLocalRecords());
    const handleStorageChange = () => {
      callback(getLocalRecords());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

/**
 * Clock In action
 */
export async function clockInUser(
  uid: string,
  settings: UserSettings,
  notes: string = ''
): Promise<{ success: boolean; message: string; entry?: AttendanceEntry }> {
  const todayStr = getTodayDateString();
  const nowIso = new Date().toISOString();

  let currentRecords: Record<string, AttendanceEntry> = {};

  if (database && isFirebaseConfigured && uid) {
    // We will update Firebase Realtime Database directly
  } else {
    currentRecords = getLocalRecords();
  }

  const existingEntry = currentRecords[todayStr];
  if (existingEntry && existingEntry.loginTime) {
    return {
      success: false,
      message: `You have already clocked in today at ${new Date(existingEntry.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
    };
  }

  const lateMinutes = calculateLateMinutes(nowIso, settings.officeStartTime);
  const status: AttendanceStatus = lateMinutes > 0 ? 'late' : 'working';

  const newEntry: AttendanceEntry = {
    date: todayStr,
    loginTime: nowIso,
    logoutTime: null,
    workedMinutes: 0,
    lateMinutes,
    overtimeMinutes: 0,
    status,
    notes,
    mood: '😊',
    updatedAt: nowIso
  };

  if (database && isFirebaseConfigured && uid) {
    const entryRef = ref(database, `attendance/${uid}/${todayStr}`);
    await set(entryRef, newEntry);
  } else {
    currentRecords[todayStr] = newEntry;
    saveLocalRecords(currentRecords);
  }

  return {
    success: true,
    message: lateMinutes > 0 
      ? `Clocked In successfully! You were ${lateMinutes}m late.` 
      : `Clocked In successfully on time!`,
    entry: newEntry
  };
}

/**
 * Clock Out action
 */
export async function clockOutUser(
  uid: string,
  settings: UserSettings,
  todayEntry: AttendanceEntry | null
): Promise<{ success: boolean; message: string; entry?: AttendanceEntry }> {
  const todayStr = getTodayDateString();
  const nowIso = new Date().toISOString();

  if (!todayEntry || !todayEntry.loginTime) {
    return {
      success: false,
      message: 'Cannot Clock Out before Clocking In!'
    };
  }

  if (todayEntry.logoutTime && todayEntry.status === 'completed') {
    return {
      success: false,
      message: 'You have already clocked out for today.'
    };
  }

  const workedMinutes = calculateWorkedMinutes(todayEntry.loginTime, nowIso);
  const overtimeMinutes = calculateOvertimeMinutes(workedMinutes, settings.targetWorkingHours);

  const updatedEntry: AttendanceEntry = {
    ...todayEntry,
    logoutTime: nowIso,
    workedMinutes,
    overtimeMinutes,
    status: 'completed',
    updatedAt: nowIso
  };

  if (database && isFirebaseConfigured && uid) {
    const entryRef = ref(database, `attendance/${uid}/${todayStr}`);
    await set(entryRef, updatedEntry);
  } else {
    const currentRecords = getLocalRecords();
    currentRecords[todayStr] = updatedEntry;
    saveLocalRecords(currentRecords);
  }

  const hoursStr = Math.floor(workedMinutes / 60);
  const minsStr = Math.round(workedMinutes % 60);

  return {
    success: true,
    message: `Clocked Out! You worked ${hoursStr}h ${minsStr}m today.`,
    entry: updatedEntry
  };
}

/**
 * Update or manually add/edit an attendance record for a date
 */
export async function updateAttendanceRecord(
  uid: string,
  dateStr: string,
  entryData: Partial<AttendanceEntry>,
  settings: UserSettings
): Promise<void> {
  const currentRecords = getLocalRecords();
  const existing = currentRecords[dateStr] || {
    date: dateStr,
    loginTime: null,
    logoutTime: null,
    workedMinutes: 0,
    lateMinutes: 0,
    overtimeMinutes: 0,
    status: 'present',
    notes: '',
    mood: '😊'
  };

  const merged: AttendanceEntry = {
    ...existing,
    ...entryData,
    date: dateStr,
    updatedAt: new Date().toISOString()
  };

  // Re-calculate minutes if login and logout are present
  if (merged.loginTime && merged.logoutTime) {
    merged.workedMinutes = calculateWorkedMinutes(merged.loginTime, merged.logoutTime);
    merged.lateMinutes = calculateLateMinutes(merged.loginTime, settings.officeStartTime);
    merged.overtimeMinutes = calculateOvertimeMinutes(merged.workedMinutes, settings.targetWorkingHours);
  }

  if (database && isFirebaseConfigured && uid) {
    const entryRef = ref(database, `attendance/${uid}/${dateStr}`);
    await set(entryRef, merged);
  } else {
    currentRecords[dateStr] = merged;
    saveLocalRecords(currentRecords);
  }
}

/**
 * Delete attendance record for a date
 */
export async function deleteAttendanceRecord(uid: string, dateStr: string): Promise<void> {
  if (database && isFirebaseConfigured && uid) {
    const entryRef = ref(database, `attendance/${uid}/${dateStr}`);
    await remove(entryRef);
  } else {
    const currentRecords = getLocalRecords();
    delete currentRecords[dateStr];
    saveLocalRecords(currentRecords);
  }
}

/**
 * Batch import CSV records
 */
export async function batchImportAttendance(
  uid: string,
  importedEntries: Partial<AttendanceEntry>[],
  settings: UserSettings
): Promise<number> {
  let count = 0;
  const currentRecords = getLocalRecords();

  for (const item of importedEntries) {
    if (!item.date) continue;
    const dateStr = item.date;

    const merged: AttendanceEntry = {
      date: dateStr,
      loginTime: item.loginTime || null,
      logoutTime: item.logoutTime || null,
      workedMinutes: item.workedMinutes || 0,
      lateMinutes: item.lateMinutes || 0,
      overtimeMinutes: item.overtimeMinutes || 0,
      status: item.status || 'completed',
      notes: item.notes || '',
      todayWork: item.todayWork || '',
      mood: item.mood || '😊',
      updatedAt: new Date().toISOString()
    };

    if (database && isFirebaseConfigured && uid) {
      const entryRef = ref(database, `attendance/${uid}/${dateStr}`);
      await set(entryRef, merged);
    } else {
      currentRecords[dateStr] = merged;
    }
    count++;
  }

  if (!isFirebaseConfigured || !database || !uid) {
    saveLocalRecords(currentRecords);
  }

  return count;
}
