import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Calendar, AlertCircle } from 'lucide-react';

export interface GlassDatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const GlassDatePicker = forwardRef<HTMLInputElement, GlassDatePickerProps>(({
  label,
  error,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-[6px]">
      {label && (
        <label htmlFor={inputId} data-role="field-label" className="text-[0.8125rem] leading-[1.125rem] font-medium text-[#4B5563] dark:text-[#9CA3AF] block select-none">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <input
          ref={ref}
          id={inputId}
          type="date"
          className={twMerge(
            clsx(
              'w-full px-4 h-[40px] max-md:h-[48px] pl-10 rounded-full text-[0.875rem] max-md:text-[1rem] leading-[1.375rem] text-[#111827] dark:text-[#FFFFFF]',
              'bg-white dark:bg-[#1E1E2A] border border-[#E5E7EB] dark:border-[#2D2D3C] shadow-2xs',
              'transition-all duration-200 outline-none cursor-pointer',
              'focus:border-[#E27AA1] focus:ring-2 focus:ring-[#E27AA1]/20',
              error && 'border-[#E11D48] focus:border-[#E11D48] focus:ring-[#E11D48]/20',
              className
            )
          )}
          {...props}
        />
        <Calendar className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF] absolute left-3.5 pointer-events-none z-10" />
      </div>
      {error && (
        <div data-role="caption" className="flex items-center gap-1.5 text-[0.75rem] leading-[1rem] font-normal text-[#E11D48]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 stroke-[1.75px]" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

GlassDatePicker.displayName = 'GlassDatePicker';
