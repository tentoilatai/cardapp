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
    success: 'bg-[#059669]/18 text-[#047857] dark:text-[#34D399] border-[#059669]/30 dark:bg-[#059669]/26',
    warning: 'bg-[#D97706]/18 text-[#B45309] dark:text-[#FBBF24] border-[#D97706]/30 dark:bg-[#D97706]/26',
    caution: 'bg-[#EA580C]/18 text-[#C2410C] dark:text-[#FB923C] border-[#EA580C]/30 dark:bg-[#EA580C]/26',
    danger: 'bg-[#E11D48]/18 text-[#BE123C] dark:text-[#FB7185] border-[#E11D48]/30 dark:bg-[#E11D48]/26',
    neutral: 'bg-white/30 dark:bg-white/10 text-[#68515E] dark:text-[#D8C9D2] border-white/50 dark:border-white/15',
    pink: 'bg-[#E27AA1]/20 text-[#BE185D] dark:text-[#F472B6] border-[#E27AA1]/35 dark:bg-[#E27AA1]/28',
    purple: 'bg-[#8B5CF6]/18 text-[#6D28D9] dark:text-[#C4B5FD] border-[#8B5CF6]/30 dark:bg-[#8B5CF6]/26',
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
