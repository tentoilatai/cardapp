import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle } from 'lucide-react';
import { formatCompactCurrency } from '../../lib/formatters';

export interface GlassCurrencyInputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string, event?: any) => void;
  unit?: string;
  showWords?: boolean;
  min?: number;
  max?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  name?: string;
  leftIcon?: React.ReactNode;
  helperText?: string;
}

/**
 * Định dạng chuỗi số với dấu chấm ngăn cách hàng nghìn (VD: 1500000 -> 1.500.000)
 */
export function formatThousands(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Lấy giá trị số thô nguyên bản (chỉ gồm các chữ số 0-9)
 */
export function parseRawNumber(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\D/g, '');
}

export const GlassCurrencyInput = forwardRef<HTMLInputElement, GlassCurrencyInputProps>(({
  label,
  error,
  placeholder = '0',
  value,
  defaultValue,
  onChange,
  unit = '₫',
  showWords = true,
  min,
  max,
  required = false,
  disabled = false,
  className,
  inputClassName,
  id,
  name,
  leftIcon,
  helperText,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const initialRaw = parseRawNumber(value !== undefined ? value : (defaultValue !== undefined ? defaultValue : ''));
  const [displayValue, setDisplayValue] = useState<string>(formatThousands(initialRaw));
  const [rawNumericValue, setRawNumericValue] = useState<string>(initialRaw);

  const isBelowMin = min !== undefined && rawNumericValue !== '' && Number(rawNumericValue) < min;

  // Đồng bộ giá trị khi prop value từ bên ngoài thay đổi
  useEffect(() => {
    if (value !== undefined) {
      const clean = parseRawNumber(value);
      setRawNumericValue(clean);
      setDisplayValue(formatThousands(clean));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const currentCursor = input.selectionStart || 0;
    const rawBeforeCursor = input.value.slice(0, currentCursor).replace(/\D/g, '').length;

    const rawValue = parseRawNumber(input.value);
    
    // Kiểm tra giới hạn max nếu có
    if (max !== undefined && rawValue && Number(rawValue) > max) {
      return;
    }

    const formatted = formatThousands(rawValue);
    setDisplayValue(formatted);
    setRawNumericValue(rawValue);

    // Tính toán lại vị trí con trỏ sau khi thêm dấu chấm ngăn cách
    requestAnimationFrame(() => {
      if (inputRef.current) {
        let newCursor = 0;
        let digitsCount = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            digitsCount++;
          }
          if (digitsCount === rawBeforeCursor) {
            newCursor = i + 1;
            break;
          }
        }
        if (digitsCount < rawBeforeCursor) {
          newCursor = formatted.length;
        }
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    });

    if (onChange) {
      const syntheticEvent = {
        target: { value: rawValue, name: name || id || '' },
        currentTarget: { value: rawValue, name: name || id || '' },
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      onChange(rawValue, syntheticEvent);
    }
  };

  const numericValue = Number(rawNumericValue) || 0;
  const wordPreview = numericValue >= 1000 ? formatCompactCurrency(numericValue) : '';
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={twMerge('w-full flex flex-col gap-[6px]', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} data-role="field-label" className="text-[0.8125rem] leading-[1.125rem] font-medium text-[#4B5563] dark:text-[#9CA3AF] block select-none">
            {label}
          </label>
          {showWords && wordPreview && (
            <span data-role="caption" className="text-[0.75rem] font-medium text-[#E27AA1] bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
              ≈ {wordPreview}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3.5 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none z-10 flex items-center justify-center">
            {leftIcon}
          </span>
        )}

        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          className={twMerge(
            clsx(
              'w-full px-4 h-[40px] max-md:h-[48px] rounded-full text-[0.875rem] max-md:text-[1rem] leading-[1.375rem] font-normal',
              'text-[#111827] dark:text-[#FFFFFF] bg-white dark:bg-[#1E1E2A] placeholder-[#9CA3AF] dark:placeholder-[#6B7280]',
              'border border-[#E5E7EB] dark:border-[#2D2D3C] shadow-2xs',
              'transition-all duration-200 outline-none tabular-nums',
              'focus:border-[#E27AA1] focus:ring-2 focus:ring-[#E27AA1]/20',
              leftIcon && 'pl-10',
              unit && 'pr-12',
              error && 'border-[#E11D48] focus:border-[#E11D48] focus:ring-[#E11D48]/20',
              disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
              inputClassName
            )
          )}
        />

        {unit && (
          <div data-role="caption" className="absolute right-3.5 text-[0.75rem] font-medium text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none select-none bg-[#F3F4F6] dark:bg-[#282836] px-2 py-0.5 rounded-full border border-[#E5E7EB] dark:border-[#2E2E3C]">
            {unit}
          </div>
        )}
      </div>

      {error || (isBelowMin && min !== undefined ? `Tối thiểu ${formatThousands(min)} ${unit}` : null) ? (
        <div data-role="caption" className="flex items-center gap-1.5 text-[0.75rem] leading-[1rem] font-normal text-[#E11D48]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 stroke-[1.75px]" />
          <span>{error || `Tối thiểu ${formatThousands(min)} ${unit}`}</span>
        </div>
      ) : helperText ? (
        <p data-role="caption" className="text-[0.75rem] leading-[1rem] font-normal text-[#68515E] dark:text-[#D8C9D2]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

GlassCurrencyInput.displayName = 'GlassCurrencyInput';
