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
    <div className="oneui-card p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-oneui-hover flex flex-col justify-between group">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-oneui-subtext dark:text-dark-subtext uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-oneui-text dark:text-white mt-1 tracking-tight">
            {value}
          </h3>
        </div>

        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105 ${iconClasses}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-2.5 border-t border-oneui-border/60 dark:border-dark-border/60 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-oneui-subtext dark:text-dark-subtext font-medium truncate">
              {subtitle}
            </span>
          )}
          {trend && (
            <span className="font-extrabold text-brand-600 dark:text-brand-400">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
