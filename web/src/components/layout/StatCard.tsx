import React from 'react';
import { CountUp } from '../glass/CountUp';

export interface StatCardProps {
  label: string;
  value: string | number;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'pink' | 'purple' | 'success' | 'warning' | 'danger';
  testId?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  isCurrency = false,
  prefix,
  suffix,
  subtext,
  icon,
  testId,
}) => {
  return (
    <div
      data-testid={testId || 'stat-card'}
      data-role="stat-card"
      className="bg-white dark:bg-[#181822] p-4 sm:p-5 rounded-2xl flex flex-col justify-between h-[96px] sm:h-[112px] min-w-0 transition-all duration-200 border border-[#E8EAEF] dark:border-[#262634] shadow-xs hover:border-[#E27AA1]/30"
    >
      {/* Top row: Label + icon */}
      <div className="flex items-center justify-between gap-2">
        <span
          data-role="stat-label"
          className="text-[0.75rem] leading-[1rem] font-medium text-[#6B7280] dark:text-[#9CA3AF] truncate"
        >
          {label}
        </span>
        {icon && (
          <div className="text-[#E27AA1] shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Middle: Big number */}
      <div
        data-role="stat-value"
        className="text-[clamp(1.5rem,1.25rem+0.8vw,1.75rem)] leading-[clamp(2rem,1.75rem+0.8vw,2.25rem)] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight tabular-nums truncate my-auto"
      >
        {typeof value === 'number' ? (
          <CountUp
            value={value}
            decimals={0}
            currency={Boolean(isCurrency)}
            prefix={prefix}
            suffix={suffix}
          />
        ) : (
          <span>{value}</span>
        )}
      </div>

      {/* Bottom: Subtitle / footnote */}
      <div
        data-role="caption"
        className="text-[0.75rem] leading-[1rem] text-[#9CA3AF] dark:text-[#6B7280] truncate font-normal"
      >
        {subtext || '—'}
      </div>
    </div>
  );
};

