import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  colorScheme?: 'brand' | 'emerald' | 'amber' | 'rose' | 'purple' | 'indigo';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'brand'
}) => {
  const colorMap = {
    brand: 'text-brand-500 bg-brand-500/10 border-brand-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  };

  const iconClasses = colorMap[colorScheme];

  return (
    <div className="glass-panel p-5 transition-all hover:scale-[1.01] hover:shadow-lg flex flex-col justify-between group">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            {value}
          </h3>
        </div>

        <div className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-110 ${iconClasses}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-dark-border/40 flex items-center justify-between text-[11px]">
          {subtitle && (
            <span className="text-slate-400 dark:text-slate-500 truncate">
              {subtitle}
            </span>
          )}
          {trend && (
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
