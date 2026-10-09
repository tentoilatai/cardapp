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
        <label htmlFor={inputId} data-role="field-label" className="text-[0.8125rem] leading-[1.125rem] font-medium text-[#68515E] dark:text-[#D8C9D2] block select-none">
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
              'w-full px-4 h-[40px] max-md:h-[48px] pl-10 rounded-full text-[0.875rem] max-md:text-[1rem] leading-[1.375rem] text-[#2C1E26] dark:text-[#FFFFFF]',
              'bg-white/20 dark:bg-white/05 border border-white/50 dark:border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]',
              'transition-all duration-200 outline-none cursor-pointer',
              'focus:border-[#E27AA1] focus:ring-3 focus:ring-[#E27AA1]/30',
              error && 'border-[#E11D48] focus:border-[#E11D48] focus:ring-[#E11D48]/30',
              className
            )
          )}
          {...props}
        />
        <Calendar className="w-4 h-4 text-[#68515E] dark:text-[#D8C9D2] absolute left-3.5 pointer-events-none z-10" />
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
