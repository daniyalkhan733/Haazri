import React from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatCurrency } from '../../utils/salaryUtils';
import { 
  Wallet, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface SalaryCardProps {
  onNavigateToSettings?: () => void;
}

export const SalaryCard: React.FC<SalaryCardProps> = ({ onNavigateToSettings }) => {
  const { stats, settings } = useAttendance();

  const monthlySalary = stats.monthlySalary || 0;
  const currency = stats.currencySymbol || 'Rs';
  const totalLate = stats.lateDaysCount || 0;
  const graceLimit = settings.lateGraceLimit ?? 3;
  const penaltyPercent = settings.latePenaltyPercent ?? 50;

  const graceUsed = stats.graceLateDaysUsed || Math.min(totalLate, graceLimit);
  const penalizedCount = stats.penalizedLateDaysCount || Math.max(0, totalLate - graceLimit);
  const totalDeductions = stats.totalLateDeductions || 0;
  const netEstimatedPayable = stats.estimatedFullMonthPayable || Math.max(0, monthlySalary - totalDeductions);

  const isPenaltyActive = penalizedCount > 0;

  return (
    <div className={`p-5 sm:p-6 rounded-squircle border transition-all ${
      isPenaltyActive 
        ? 'bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent border-amber-500/30' 
        : 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20'
    }`}>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-oneui-border/60 dark:border-dark-border/60">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            isPenaltyActive 
              ? 'bg-amber-500 text-white shadow-amber-500/25' 
              : 'bg-emerald-500 text-white shadow-emerald-500/25'
          }`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-extrabold text-oneui-text dark:text-white tracking-tight">
                Salary & Late Deduction Status
              </h3>
              {monthlySalary > 0 ? (
                isPenaltyActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>50% Deduction Active ({penalizedCount} Days)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Grace Covered ({graceUsed}/{graceLimit} Days)</span>
                  </span>
                )
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Salary Not Configured
                </span>
              )}
            </div>
            <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium mt-0.5">
              3-day late grace rule · 50% deducted on day 4+ arrivals · {stats.daysInSelectedMonth || 30} days in {stats.selectedMonthLabel}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {onNavigateToSettings && (
          <button
            onClick={onNavigateToSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-dark-card/90 text-oneui-text dark:text-white text-xs font-bold border border-oneui-border dark:border-dark-border hover:bg-brand-500/10 hover:text-brand-500 transition-all self-start md:self-auto shadow-sm"
          >
            <span>Configure Salary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        {/* Monthly Base Salary */}
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-dark-card/80 border border-oneui-border/70 dark:border-dark-border/70">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Base Monthly Salary
          </p>
          <p className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
            {formatCurrency(monthlySalary, currency)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {stats.daysInSelectedMonth || 30} days in month
          </p>
        </div>

        {/* Daily & Hourly Rate */}
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-dark-card/80 border border-oneui-border/70 dark:border-dark-border/70">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Daily Salary Rate
          </p>
          <p className="text-base sm:text-lg font-black font-mono text-brand-600 dark:text-brand-400 mt-1">
            {formatCurrency(stats.baseDailyRate, currency)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {formatCurrency(stats.hourlySalaryRate, currency)}/hr ({settings.targetWorkingHours}h target)
          </p>
        </div>

        {/* Late Penalty Deductions */}
        <div className={`p-3.5 rounded-2xl border ${
          isPenaltyActive 
            ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400' 
            : 'bg-white/80 dark:bg-dark-card/80 border-oneui-border/70 dark:border-dark-border/70'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider">
            Late Deductions ({penaltyPercent}%)
          </p>
          <p className={`text-base sm:text-lg font-black font-mono mt-1 ${isPenaltyActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {totalDeductions > 0 ? `-${formatCurrency(totalDeductions, currency)}` : `${currency} 0.00`}
          </p>
          <p className="text-[10px] font-medium mt-0.5 opacity-80">
            {totalLate} total late ({graceUsed} grace, {penalizedCount} penalized)
          </p>
        </div>

        {/* Estimated Net Payout */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Net Month Salary
          </p>
          <p className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(netEstimatedPayable, currency)}
          </p>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5">
            After {totalDeductions > 0 ? formatCurrency(totalDeductions, currency) : 'Rs 0'} deductions
          </p>
        </div>
      </div>

      {/* Grace Progress Bar & Policy Explanation */}
      <div className="mt-4 p-3.5 rounded-2xl bg-white/60 dark:bg-dark-card/60 border border-oneui-border/60 dark:border-dark-border/60 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-oneui-text dark:text-white flex items-center gap-1.5">
            <span>Late Arrival Grace Allowance:</span>
            <span className={graceUsed >= graceLimit ? 'text-amber-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
              {graceUsed} of {graceLimit} Used
            </span>
          </span>
          <span className="text-[11px] text-oneui-subtext dark:text-dark-subtext font-semibold">
            {penalizedCount > 0 ? (
              <span className="text-rose-500 font-bold">
                ⚠️ {penalizedCount} late arrival{penalizedCount > 1 ? 's' : ''} charged with 50% deduction
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {Math.max(0, graceLimit - totalLate)} grace late arrival{Math.max(0, graceLimit - totalLate) === 1 ? '' : 's'} remaining
              </span>
            )}
          </span>
        </div>

        {/* Progress pill indicator */}
        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
          <div 
            className={`h-full transition-all duration-500 ${
              isPenaltyActive ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, (graceUsed / graceLimit) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
