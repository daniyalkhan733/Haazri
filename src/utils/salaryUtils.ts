import { AttendanceEntry, UserSettings } from '../types';
import { getDaysInMonth, parseISO, isSameMonth } from 'date-fns';
import { calculateLateMinutes } from './timeUtils';

export interface DailySalaryBreakdown {
  date: string;
  isLate: boolean;
  lateMinutes: number;
  lateIndexInMonth: number; // 1, 2, 3 (grace) or 4+ (penalized)
  isGrace: boolean; // true if lateIndex <= lateGraceLimit
  isPenalized: boolean; // true if lateIndex > lateGraceLimit
  workedMinutes: number;
  workedHours: number;
  baseDailyRate: number; // monthlySalary / daysInMonth
  hourlyRate: number; // baseDailyRate / targetWorkingHours
  dailySalaryEarned: number; // hourlyRate * workedHours
  deductionPercent: number; // 0 or 50%
  deductionAmount: number; // 50% of dailySalaryEarned
  netDailySalary: number; // dailySalaryEarned - deductionAmount
  status: string;
}

export interface MonthSalaryAnalytics {
  monthlySalary: number;
  currencySymbol: string;
  daysInMonth: number;
  targetWorkingHours: number;
  baseDailyRate: number;
  hourlyRate: number;
  lateGraceLimit: number;
  latePenaltyPercent: number;
  
  // Late counts
  totalLateCount: number;
  graceLateCount: number;
  penalizedLateCount: number;
  remainingGraceCount: number;
  
  // Financial totals
  totalLateDeductions: number;
  totalWorkedHours: number;
  earnedSalaryBeforeDeductions: number;
  netPayableSalary: number;
  estimatedFullMonthPayable: number; // monthlySalary - totalLateDeductions
  
  // Per-date lookup
  dailyBreakdown: Record<string, DailySalaryBreakdown>;
}

/**
 * Format currency with symbol and localized commas
 */
export function formatCurrency(amount: number, currency: string = 'Rs'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${currency} 0.00`;
  }
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${currency} ${formatted}` : `${currency} ${formatted}`;
}

/**
 * Check if a date string is Sunday
 */
function isSundayDateStr(dateStr: string): boolean {
  try {
    const d = parseISO(dateStr);
    return d.getDay() === 0;
  } catch {
    return false;
  }
}

/**
 * Computes the salary analytics and the 50% late deduction rule for a given month.
 * Rule:
 *  - First 3 late arrivals in the month are grace (0% deduction).
 *  - 4th and subsequent late arrivals in the month incur a 50% deduction of that day's daily salary.
 *  - Daily salary is calculated from number of hours working and days in the current month:
 *      baseDailyRate = monthlySalary / daysInMonth
 *      hourlyRate = baseDailyRate / targetWorkingHours
 *      dailySalaryEarned = hourlyRate * (workedMinutes / 60)
 */
export function calculateMonthSalary(
  records: Record<string, AttendanceEntry>,
  settings: UserSettings,
  targetMonthDate: Date = new Date()
): MonthSalaryAnalytics {
  const monthlySalary = Number(settings.monthlySalary) || 0;
  const currencySymbol = settings.currencySymbol || 'Rs';
  const targetWorkingHours = Number(settings.targetWorkingHours) || 9;
  const lateGraceLimit = Number(settings.lateGraceLimit) ?? 3;
  const latePenaltyPercent = Number(settings.latePenaltyPercent) ?? 50;

  const daysInMonth = getDaysInMonth(targetMonthDate);
  const baseDailyRate = daysInMonth > 0 ? Number((monthlySalary / daysInMonth).toFixed(2)) : 0;
  const hourlyRate = targetWorkingHours > 0 ? Number((baseDailyRate / targetWorkingHours).toFixed(2)) : 0;

  // Filter entries belonging to target month and sort chronologically ascending
  const monthEntries = Object.values(records)
    .filter(e => {
      if (!e || !e.date) return false;
      try {
        return isSameMonth(parseISO(e.date), targetMonthDate);
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  let runningLateCount = 0;
  let totalLateDeductions = 0;
  let earnedSalaryBeforeDeductions = 0;
  let totalWorkedHours = 0;

  const dailyBreakdown: Record<string, DailySalaryBreakdown> = {};

  monthEntries.forEach(entry => {
    const workedMins = entry.workedMinutes || 0;
    const workedHours = Number((workedMins / 60).toFixed(2));
    totalWorkedHours += workedHours;

    // Check if Sunday
    const isSunday = isSundayDateStr(entry.date) || (entry.notes || '').toLowerCase().includes('sunday');
    const cutoffTime = isSunday ? '11:00' : settings.officeStartTime;

    const lateMins = entry.loginTime ? calculateLateMinutes(entry.loginTime, cutoffTime) : 0;
    const isLate = (entry.status === 'late' || lateMins > 0) && entry.status !== 'absent' && entry.status !== 'vacation';

    let lateIndexInMonth = 0;
    let isGrace = false;
    let isPenalized = false;
    let deductionPercent = 0;

    if (isLate) {
      runningLateCount++;
      lateIndexInMonth = runningLateCount;

      if (lateIndexInMonth <= lateGraceLimit) {
        isGrace = true;
        deductionPercent = 0;
      } else {
        isPenalized = true;
        deductionPercent = latePenaltyPercent;
      }
    }

    // Daily salary earned on this day based on hours worked and days in the current month
    // If not absent/vacation: hourlyRate * workedHours
    let dailySalaryEarned = 0;
    if (entry.status !== 'absent' && entry.status !== 'vacation' && workedMins > 0) {
      dailySalaryEarned = Number((hourlyRate * workedHours).toFixed(2));
    }

    earnedSalaryBeforeDeductions += dailySalaryEarned;

    // Deduction calculation
    let deductionAmount = 0;
    if (isPenalized && dailySalaryEarned > 0) {
      deductionAmount = Number((dailySalaryEarned * (deductionPercent / 100)).toFixed(2));
    }

    totalLateDeductions += deductionAmount;

    const netDailySalary = Number((dailySalaryEarned - deductionAmount).toFixed(2));

    dailyBreakdown[entry.date] = {
      date: entry.date,
      isLate,
      lateMinutes: lateMins,
      lateIndexInMonth,
      isGrace,
      isPenalized,
      workedMinutes: workedMins,
      workedHours,
      baseDailyRate,
      hourlyRate,
      dailySalaryEarned,
      deductionPercent,
      deductionAmount,
      netDailySalary,
      status: entry.status,
    };
  });

  const totalLateCount = runningLateCount;
  const graceLateCount = Math.min(totalLateCount, lateGraceLimit);
  const penalizedLateCount = Math.max(0, totalLateCount - lateGraceLimit);
  const remainingGraceCount = Math.max(0, lateGraceLimit - totalLateCount);

  totalLateDeductions = Number(totalLateDeductions.toFixed(2));
  earnedSalaryBeforeDeductions = Number(earnedSalaryBeforeDeductions.toFixed(2));
  const netPayableSalary = Number(Math.max(0, earnedSalaryBeforeDeductions - totalLateDeductions).toFixed(2));
  const estimatedFullMonthPayable = Number(Math.max(0, monthlySalary - totalLateDeductions).toFixed(2));

  return {
    monthlySalary,
    currencySymbol,
    daysInMonth,
    targetWorkingHours,
    baseDailyRate,
    hourlyRate,
    lateGraceLimit,
    latePenaltyPercent,

    totalLateCount,
    graceLateCount,
    penalizedLateCount,
    remainingGraceCount,

    totalLateDeductions,
    totalWorkedHours: Number(totalWorkedHours.toFixed(1)),
    earnedSalaryBeforeDeductions,
    netPayableSalary,
    estimatedFullMonthPayable,

    dailyBreakdown,
  };
}
