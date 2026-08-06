export type AttendanceStatus = 
  | 'working' 
  | 'completed' 
  | 'present' 
  | 'late' 
  | 'half_day' 
  | 'vacation' 
  | 'absent' 
  | 'early';

export type MoodType = '😊' | '😐' | '😫' | '🔥' | '🎉' | '😴';

export interface AttendanceEntry {
  date: string; // YYYY-MM-DD
  loginTime: string | null; // ISO format string e.g. "2026-07-30T11:30:15"
  logoutTime: string | null; // ISO format string e.g. "2026-07-30T20:15:42"
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
  notes?: string;
  todayWork?: string;
  remarks?: string;
  tasksCompleted?: string[];
  mood?: MoodType;
  isHalfDay?: boolean;
  isVacation?: boolean;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
  createdAt?: string;
}

export interface UserSettings {
  officeStartTime: string; // Default "12:30" (Late Cutoff)
  targetWorkingHours: number; // 9
  lunchBreakMinutes: number; // 0 or 60
  enableNotifications: boolean;
  clockInReminderTime: string; // "12:30"
  clockOutReminderTime: string; // "21:00"
  theme: 'dark' | 'light' | 'system';
}

export interface AttendanceStats {
  todayLogin: string | null;
  todayLogout: string | null;
  todayWorkedMinutes: number;
  expectedLogout: string | null;
  currentStatus: AttendanceStatus | 'not_clocked_in';
  currentMonthHours: number;
  avgLoginTime: string;
  avgLogoutTime: string;
  lateDaysCount: number;
  overtimeMinutesTotal: number;
  attendancePercentage: number;
  currentStreak: number;
  longestStreak: number;
  workingDaysTotal: number;
  missedDaysCount: number;
  
  // Flex-Hours & Cumulative Balance
  totalTargetHours: number;
  totalActualHours: number;
  netFlexBalanceHours: number;
  netOvertimeHours: number;
  netShortfallHours: number;
  coveredShortfallDaysCount: number;

  // Selected Month Metadata
  selectedMonthLabel: string;
  monthProgressPercent: number;
  isCurrentMonth: boolean;
}
