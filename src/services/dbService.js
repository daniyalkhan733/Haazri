// Offline-First Database Service with Supabase Sync
import { createClient } from '@supabase/supabase-js';
import { getYYYYMMDD, getHHMMSS, calculateWorkDuration, isLate, isEarlyLeave } from '../utils/timeHelpers';

const USER_KEY = 'personal_tracker_user';
const ATTENDANCE_KEY = 'personal_tracker_records';
const SETTINGS_KEY = 'personal_tracker_settings';

// Fetch Vite env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and not placeholders
const isConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-project-id')
);

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Default User Profile
const DEFAULT_USER = {
  id: 'me',
  name: 'Alex Mercer',
  employee_id: 'EMP-101',
  email: 'alex@company.com',
  department: 'Product Development',
  role: 'user',
  profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

// Default Settings
const DEFAULT_SETTINGS = {
  officeStartTime: '09:00',
  officeEndTime: '18:00',
  standardWorkingHours: 8,
  timeFormat: '12',
  theme: 'dark'
};

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Generate local seed if empty
function generateMockAttendance(settings) {
  const records = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 45);

  const stdStart = settings.officeStartTime;
  const stdEnd = settings.officeEndTime;

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = getYYYYMMDD(d);
    if (dateStr === getYYYYMMDD(today)) continue;

    const isWknd = isWeekend(d);
    const randomValue = Math.random();

    if (isWknd) {
      if (randomValue > 0.95) {
        const entryHour = 9 + Math.floor(Math.random() * 2);
        const entryMin = Math.floor(Math.random() * 60);
        const exitHour = 14 + Math.floor(Math.random() * 3);
        const exitMin = Math.floor(Math.random() * 60);

        const checkIn = `${String(entryHour).padStart(2, '0')}:${String(entryMin).padStart(2, '0')}:00`;
        const checkOut = `${String(exitHour).padStart(2, '0')}:${String(exitMin).padStart(2, '0')}:00`;
        const dur = calculateWorkDuration(checkIn, checkOut);

        records.push({
          id: `seed-me-${dateStr}`,
          user_id: 'me',
          date: dateStr,
          check_in_time: checkIn,
          check_out_time: checkOut,
          total_hours: dur.decimalHours,
          total_minutes: dur.totalMinutes,
          overtime: dur.decimalHours,
          status: 'Present',
          remarks: 'Weekend Overtime Log',
          gps_in: { latitude: 37.7749, longitude: -122.4194 },
          gps_out: { latitude: 37.7749, longitude: -122.4194 },
          created_at: `${dateStr}T${checkIn}Z`
        });
      }
      continue;
    }

    if (randomValue < 0.88) {
      let inH = 8;
      let inM = 35 + Math.floor(Math.random() * 45);
      if (inM >= 60) {
        inH = 9;
        inM = inM - 60;
      }
      
      let outH = 17;
      let outM = 45 + Math.floor(Math.random() * 45);
      if (outM >= 60) {
        outH = 18;
        outM = outM - 60;
      }

      const checkIn = `${String(inH).padStart(2, '0')}:${String(inM).padStart(2, '0')}:00`;
      const checkOut = `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}:00`;
      const dur = calculateWorkDuration(checkIn, checkOut);
      const checkInLate = isLate(checkIn, stdStart);
      const checkOutEarly = isEarlyLeave(checkOut, stdEnd);

      let status = 'Present';
      let remarks = 'On Time Entry';

      if (checkInLate) {
        status = 'Late';
        remarks = 'Late entry due to commute';
      } else if (checkOutEarly) {
        status = 'Present';
        remarks = 'Left early with permission';
      }

      if (dur.decimalHours < 5) {
        status = 'Half-Day';
        remarks = 'Worked half-day shift';
      }

      const overtime = Math.max(0, dur.decimalHours - settings.standardWorkingHours);

      records.push({
        id: `seed-me-${dateStr}`,
        user_id: 'me',
        date: dateStr,
        check_in_time: checkIn,
        check_out_time: checkOut,
        total_hours: dur.decimalHours,
        total_minutes: dur.totalMinutes,
        overtime: parseFloat(overtime.toFixed(2)),
        status: status,
        remarks: remarks,
        gps_in: { latitude: 37.7749, longitude: -122.4194 },
        gps_out: { latitude: 37.7749, longitude: -122.4194 },
        created_at: `${dateStr}T${checkIn}Z`
      });
    } else if (randomValue < 0.96) {
      records.push({
        id: `seed-me-${dateStr}`,
        user_id: 'me',
        date: dateStr,
        check_in_time: null,
        check_out_time: null,
        total_hours: 0,
        total_minutes: 0,
        overtime: 0,
        status: 'Absent',
        remarks: Math.random() > 0.5 ? 'Sick Leave' : 'Casual Leave',
        gps_in: null,
        gps_out: null,
        created_at: `${dateStr}T09:00:00Z`
      });
    } else {
      records.push({
        id: `seed-me-${dateStr}`,
        user_id: 'me',
        date: dateStr,
        check_in_time: null,
        check_out_time: null,
        total_hours: 0,
        total_minutes: 0,
        overtime: 0,
        status: 'Holiday',
        remarks: 'Public Holiday',
        gps_in: null,
        gps_out: null,
        created_at: `${dateStr}T09:00:00Z`
      });
    }
  }

  return records;
}

export function initializeDB() {
  let user = localStorage.getItem(USER_KEY);
  let settings = localStorage.getItem(SETTINGS_KEY);
  let attendance = localStorage.getItem(ATTENDANCE_KEY);

  if (!settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    settings = JSON.stringify(DEFAULT_SETTINGS);
  }

  if (!user) {
    localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
    user = JSON.stringify(DEFAULT_USER);
  }

  if (!attendance) {
    const parsedSettings = JSON.parse(settings);
    const seededRecords = generateMockAttendance(parsedSettings);
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(seededRecords));
  }
}

// Check configuration status
export function isCloudEnabled() {
  return isConfigured;
}

// Supabase Async Background Synchronization
async function syncRecordToCloud(record) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('attendance').upsert({
      id: record.id,
      user_id: record.user_id,
      date: record.date,
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
      total_hours: record.total_hours,
      total_minutes: record.total_minutes,
      overtime: record.overtime,
      status: record.status,
      remarks: record.remarks,
      gps_in: record.gps_in,
      gps_out: record.gps_out,
      created_at: record.created_at
    });
    if (error) throw error;
  } catch (err) {
    console.warn('Sync push warning (operating offline):', err.message);
  }
}

async function deleteRecordFromCloud(recordId) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('attendance').delete().eq('id', recordId);
    if (error) throw error;
  } catch (err) {
    console.warn('Sync delete warning (operating offline):', err.message);
  }
}

// Pull cloud data to update local cache on app load
export async function syncSupabaseToLocal() {
  if (!supabase) return false;
  try {
    // 1. Sync User Profile
    const localUser = getCurrentUser();
    const { data: profile, error: pError } = await supabase
      .from('profile')
      .select('*')
      .eq('id', 'me')
      .single();

    if (profile) {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } else {
      // Profile does not exist in Supabase yet, upload local profile
      await supabase.from('profile').upsert(localUser);
    }

    // 2. Sync Attendance Logs
    const { data: cloudRecords, error: aError } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });

    if (cloudRecords && !aError) {
      const localRecords = getAttendanceRecords();
      
      // Merge strategy: Overwrite local logs with cloud records.
      // But keep any local logs created today that might not be synced yet.
      const todayStr = getYYYYMMDD();
      const unsyncedToday = localRecords.filter(r => r.date === todayStr && !cloudRecords.find(cr => cr.id === r.id));
      
      const merged = [...unsyncedToday, ...cloudRecords];
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(merged));
      return true;
    }
  } catch (err) {
    console.error('Supabase fetch sync failed:', err.message);
  }
  return false;
}

// User Actions
export function getCurrentUser() {
  initializeDB();
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : DEFAULT_USER;
}

export function updateUserProfile(userId, updatedFields) {
  const user = getCurrentUser();
  const updated = { ...user, ...updatedFields };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));

  // Push profile updates to cloud
  if (supabase) {
    supabase.from('profile').upsert(updated).then(({ error }) => {
      if (error) console.warn('Supabase profile sync warning:', error.message);
    });
  }
  return { success: true, user: updated };
}

// Settings Actions
export function getSettings() {
  initializeDB();
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify(DEFAULT_SETTINGS));
}

export function saveSettings(newSettings) {
  const currentSettings = getSettings();
  const updated = { ...currentSettings, ...newSettings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// Attendance Core Flow
export function getAttendanceRecords() {
  initializeDB();
  return JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '[]');
}

export function getTodayStatus() {
  const todayStr = getYYYYMMDD();
  const records = getAttendanceRecords();
  const todayRecord = records.find(r => r.date === todayStr);

  if (!todayRecord) {
    return { state: 'Not Checked In', record: null };
  }
  if (todayRecord.check_in_time && !todayRecord.check_out_time) {
    return { state: 'Checked In', record: todayRecord };
  }
  return { state: 'Checked Out', record: todayRecord };
}

export function checkIn(userId = 'me', location = null) {
  const todayStr = getYYYYMMDD();
  const timeStr = getHHMMSS();
  const records = getAttendanceRecords();
  const settings = getSettings();

  const existing = records.find(r => r.date === todayStr);
  if (existing) {
    return { success: false, message: 'Already checked in today', record: existing };
  }

  const isCheckInLate = isLate(timeStr, settings.officeStartTime);

  const newRecord = {
    id: `rec-me-${Date.now()}`,
    user_id: 'me',
    date: todayStr,
    check_in_time: timeStr,
    check_out_time: null,
    total_hours: 0,
    total_minutes: 0,
    overtime: 0,
    status: isCheckInLate ? 'Late' : 'Present',
    remarks: isCheckInLate ? 'Checked in late' : 'Clocked in successfully',
    gps_in: location,
    gps_out: null,
    created_at: new Date().toISOString()
  };

  records.push(newRecord);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  
  // Background Sync
  syncRecordToCloud(newRecord);

  return { success: true, record: newRecord };
}

export function checkOut(userId = 'me', location = null) {
  const todayStr = getYYYYMMDD();
  const timeStr = getHHMMSS();
  const records = getAttendanceRecords();
  const settings = getSettings();

  const recordIndex = records.findIndex(r => r.date === todayStr);
  if (recordIndex === -1) {
    return { success: false, message: 'No check-in record found for today' };
  }

  const record = records[recordIndex];
  if (record.check_out_time) {
    return { success: false, message: 'Already checked out today', record };
  }

  const dur = calculateWorkDuration(record.check_in_time, timeStr);
  const overtime = Math.max(0, dur.decimalHours - settings.standardWorkingHours);
  
  let finalStatus = record.status;
  let finalRemarks = record.remarks;
  
  if (dur.decimalHours < 5) {
    finalStatus = 'Half-Day';
    finalRemarks = 'Half-day due to short duration';
  } else if (isEarlyLeave(timeStr, settings.officeEndTime)) {
    finalRemarks += ' & Left early';
  } else {
    finalRemarks += ' & Checked out successfully';
  }

  const updatedRecord = {
    ...record,
    check_out_time: timeStr,
    total_hours: dur.decimalHours,
    total_minutes: dur.totalMinutes,
    overtime: parseFloat(overtime.toFixed(2)),
    status: finalStatus,
    remarks: finalRemarks,
    gps_out: location
  };

  records[recordIndex] = updatedRecord;
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  
  // Background Sync
  syncRecordToCloud(updatedRecord);

  return { success: true, record: updatedRecord };
}

export function addManualRecord(userId = 'me', fields) {
  const records = getAttendanceRecords();
  const settings = getSettings();
  
  const existingIndex = records.findIndex(r => r.date === fields.date);
  
  const dur = calculateWorkDuration(fields.check_in_time, fields.check_out_time);
  const overtime = Math.max(0, dur.decimalHours - settings.standardWorkingHours);

  const updatedRecord = {
    id: existingIndex !== -1 ? records[existingIndex].id : `rec-me-${Date.now()}`,
    user_id: 'me',
    date: fields.date,
    check_in_time: fields.check_in_time || null,
    check_out_time: fields.check_out_time || null,
    total_hours: dur.decimalHours,
    total_minutes: dur.totalMinutes,
    overtime: parseFloat(overtime.toFixed(2)),
    status: fields.status || 'Present',
    remarks: fields.remarks || 'Manually entered',
    gps_in: fields.gps_in || null,
    gps_out: fields.gps_out || null,
    created_at: new Date().toISOString()
  };

  if (existingIndex !== -1) {
    records[existingIndex] = updatedRecord;
  } else {
    records.push(updatedRecord);
  }

  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  
  // Background Sync
  syncRecordToCloud(updatedRecord);

  return { success: true, record: updatedRecord };
}

export function deleteRecord(recordId) {
  const records = getAttendanceRecords();
  const filtered = records.filter(r => r.id !== recordId);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(filtered));
  
  // Background Sync
  deleteRecordFromCloud(recordId);

  return { success: true };
}
