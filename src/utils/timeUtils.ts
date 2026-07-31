import { format, parse, differenceInMinutes, addMinutes, isAfter, isBefore, isValid } from 'date-fns';
import { AttendanceEntry, UserSettings } from '../types';

/**
 * Returns current date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Format ISO time string or Date object to 12-hour format e.g. "11:30 AM"
 */
export function formatTimeDisplay(isoOrDate: string | Date | null): string {
  if (!isoOrDate) return '--:--';
  const dateObj = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (!isValid(dateObj)) return '--:--';
  return format(dateObj, 'hh:mm a');
}

/**
 * Format YYYY-MM-DD date string to readable format e.g. "Jul 30, 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const dateObj = parse(dateStr, 'yyyy-MM-dd', new Date());
  if (!isValid(dateObj)) return dateStr;
  return format(dateObj, 'MMM dd, yyyy');
}

/**
 * Format total minutes to "Xh Ym" or "Ym"
 */
export function formatDuration(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Calculates late minutes based on login time and office late cutoff time (Default 12:30 PM)
 * Rule: Arriving after 12:30 PM is marked as Late. Arriving <= 12:30 PM is On-Time.
 */
export function calculateLateMinutes(loginIso: string, officeStartTime: string = "12:30"): number {
  if (!loginIso) return 0;
  const loginDate = new Date(loginIso);
  if (!isValid(loginDate)) return 0;

  const [targetHours, targetMins] = officeStartTime.split(':').map(Number);
  const cutoffDate = new Date(loginDate);
  cutoffDate.setHours(targetHours, targetMins, 0, 0);

  if (isAfter(loginDate, cutoffDate)) {
    return differenceInMinutes(loginDate, cutoffDate);
  }
  return 0;
}

/**
 * Calculates early minutes relative to office cutoff
 */
export function calculateEarlyMinutes(loginIso: string, officeStartTime: string = "12:30"): number {
  if (!loginIso) return 0;
  const loginDate = new Date(loginIso);
  if (!isValid(loginDate)) return 0;

  const [targetHours, targetMins] = officeStartTime.split(':').map(Number);
  const cutoffDate = new Date(loginDate);
  cutoffDate.setHours(targetHours, targetMins, 0, 0);

  if (isBefore(loginDate, cutoffDate)) {
    return differenceInMinutes(cutoffDate, loginDate);
  }
  return 0;
}

/**
 * Calculates worked minutes between login and logout
 */
export function calculateWorkedMinutes(loginIso: string, logoutIso: string): number {
  if (!loginIso || !logoutIso) return 0;
  const loginDate = new Date(loginIso);
  const logoutDate = new Date(logoutIso);
  if (!isValid(loginDate) || !isValid(logoutDate)) return 0;

  const diff = differenceInMinutes(logoutDate, loginDate);
  return diff > 0 ? diff : 0;
}

/**
 * Calculates overtime minutes based on total worked minutes and daily target (e.g. 9 hours)
 */
export function calculateOvertimeMinutes(workedMinutes: number, targetWorkingHours: number = 9): number {
  const targetMinutes = targetWorkingHours * 60;
  if (workedMinutes > targetMinutes) {
    return workedMinutes - targetMinutes;
  }
  return 0;
}

/**
 * Calculates expected logout ISO timestamp based on login time and target working hours (9 hours)
 */
export function calculateExpectedLogoutIso(loginIso: string, targetWorkingHours: number = 9): string | null {
  if (!loginIso) return null;
  const loginDate = new Date(loginIso);
  if (!isValid(loginDate)) return null;

  const expectedDate = addMinutes(loginDate, targetWorkingHours * 60);
  return expectedDate.toISOString();
}

/**
 * Generates smart message adhering to 12:30 PM Late Cutoff & Flex-hours rules
 */
export function getSmartMessage(todayEntry: AttendanceEntry | null, settings: UserSettings): string {
  if (!todayEntry || !todayEntry.loginTime) {
    return `Office rule: Arriving after ${settings.officeStartTime} PM is marked Late. Flex hours automatically offset shorter shifts!`;
  }

  if (todayEntry.status === 'completed' && todayEntry.logoutTime) {
    const workedStr = formatDuration(todayEntry.workedMinutes);
    return `You worked ${workedStr} today. Longer shifts automatically offset shorter days!`;
  }

  // Currently working
  const expectedLogout = calculateExpectedLogoutIso(todayEntry.loginTime, settings.targetWorkingHours);
  const expectedLogoutFormatted = formatTimeDisplay(expectedLogout);
  
  const lateMins = todayEntry.lateMinutes || calculateLateMinutes(todayEntry.loginTime, settings.officeStartTime);

  if (lateMins > 0) {
    return `Arrived after ${settings.officeStartTime} PM (${lateMins}m late). Expected logout to complete 9h shift is ${expectedLogoutFormatted}.`;
  }

  return `Punctual arrival (before ${settings.officeStartTime} PM cutoff)! Expected 9h completion at ${expectedLogoutFormatted}.`;
}

/**
 * Format seconds into HH:MM:SS live timer string
 */
export function formatTimerSeconds(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
