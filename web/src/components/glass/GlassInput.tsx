import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Search, AlertCircle } from 'lucide-react';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  shape?: 'pill' | 'rounded';
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  helperText,
  shape = 'pill',
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Automatically supply search icon if search input
  const isSearchInput =
    props.type === 'search' ||
    (!leftIcon && typeof props.placeholder === 'string' && /tìm/i.test(props.placeholder));
  const effectiveLeftIcon =
    leftIcon || (isSearchInput ? <Search className="w-4 h-4 text-[#68515E] dark:text-[#D8C9D2]" /> : null);

  return (
    <div className="w-full flex flex-col gap-[6px]">
      {label && (
        <label
          htmlFor={inputId}
          data-role="field-label"
          className="text-[0.8125rem] leading-[1.125rem] font-medium text-[#4B5563] dark:text-[#9CA3AF] select-none"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            clsx(
              'w-full h-[40px] max-md:h-[48px] px-4 text-[0.875rem] max-md:text-[1rem] leading-[1.375rem]',
              'text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#6B7280]',
              'bg-white dark:bg-[#1E1E2A] border border-[#E5E7EB] dark:border-[#2D2D3C] shadow-2xs',
              'transition-all duration-200 outline-none rounded-full',
              'focus:border-[#E27AA1] focus:ring-2 focus:ring-[#E27AA1]/20',
              effectiveLeftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[#E11D48] focus:border-[#E11D48] focus:ring-[#E11D48]/20',
              className
            )
          )}
          {...props}
        />
        {effectiveLeftIcon && (
          <span className="absolute left-3.5 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none z-10 flex items-center justify-center">
            {effectiveLeftIcon}
          </span>
        )}
        {rightIcon && (
          <div className="absolute right-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex items-center z-10">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <div data-role="caption" className="flex items-center gap-1.5 text-[0.75rem] leading-[1rem] font-normal text-[#E11D48]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 stroke-[1.75px]" />
          <span>{error}</span>
        </div>
      )}
      {helperText && !error && (
        <p data-role="caption" className="text-[0.75rem] leading-[1rem] font-normal text-[#68515E] dark:text-[#D8C9D2]">
          {helperText}
        </p>
      )}
    </div>
  );
});

GlassInput.displayName = 'GlassInput';
