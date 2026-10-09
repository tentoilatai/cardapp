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
      className="glass-surface-tier2 p-4 sm:p-5 rounded-2xl flex flex-col justify-between h-[96px] sm:h-[112px] min-w-0 transition-all duration-200 relative overflow-hidden group border border-white/50 dark:border-white/15 shadow-[0_4px_16px_rgba(226,122,161,0.06),inset_0_1px_1px_rgba(255,255,255,0.6)]"
    >
      {/* Specular top rim light */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent z-10" />

      {/* Top row: Label (left 12px) + optional icon (right) */}
      <div className="flex items-center justify-between gap-2">
        <span
          data-role="stat-label"
          className="text-[0.75rem] leading-[1rem] font-medium text-[#68515E] dark:text-[#D8C9D2] truncate"
        >
          {label}
        </span>
        {icon && (
          <div className="text-[#E27AA1] shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Middle: Big number (display 28/24px, 600 weight, tabular-nums) */}
      <div
        data-role="stat-value"
        className="text-[clamp(1.5rem,1.25rem+0.8vw,1.75rem)] leading-[clamp(2rem,1.75rem+0.8vw,2.25rem)] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight tabular-nums truncate my-auto drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
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

      {/* Bottom: Subtitle / footnote (caption 12px) */}
      <div
        data-role="caption"
        className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] truncate font-normal"
      >
        {subtext || '—'}
      </div>
    </div>
  );
};
