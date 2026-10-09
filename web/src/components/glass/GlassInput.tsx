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
          className="text-[0.8125rem] leading-[1.125rem] font-medium text-[#68515E] dark:text-[#D8C9D2] select-none"
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
              'text-[#2C1E26] dark:text-[#FFFFFF] placeholder-[#8E7583] dark:placeholder-[#9E8B97]',
              'bg-white/20 dark:bg-white/05 border border-white/50 dark:border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]',
              'transition-all duration-200 outline-none rounded-full',
              'focus:border-[#E27AA1] focus:ring-3 focus:ring-[#E27AA1]/30',
              effectiveLeftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[#E11D48] focus:border-[#E11D48] focus:ring-[#E11D48]/30',
              className
            )
          )}
          {...props}
        />
        {effectiveLeftIcon && (
          <span className="absolute left-3.5 text-[#68515E] dark:text-[#D8C9D2] pointer-events-none z-10 flex items-center justify-center">
            {effectiveLeftIcon}
          </span>
        )}
        {rightIcon && (
          <div className="absolute right-3.5 text-[#68515E] dark:text-[#D8C9D2] flex items-center z-10">
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
