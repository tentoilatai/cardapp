import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'caution' | 'danger' | 'neutral' | 'pink' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
}) => {
  const dotColors = {
    success: 'bg-[#059669]',
    warning: 'bg-[#D97706]',
    caution: 'bg-[#EA580C]',
    danger: 'bg-[#E11D48]',
    neutral: 'bg-[#68515E]',
    pink: 'bg-[#E27AA1]',
    purple: 'bg-[#8B5CF6]',
  };

  const variantStyles = {
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    caution: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/40',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
    neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    pink: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/40',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
  };

  const sizeStyles = {
    sm: 'h-[22px] px-2 text-[0.75rem] leading-[1rem] rounded-full gap-1 font-medium',
    md: 'h-[24px] px-2.5 text-[0.75rem] leading-[1rem] rounded-full gap-1.5 font-medium',
  };

  return (
    <span
      data-role="caption"
      data-badge="true"
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center border select-none transition-colors shrink-0 rounded-full',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant]
          )}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
};
