import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, Check, Search, X, AlertCircle } from 'lucide-react';

export interface GlassSelectOption {
  value: string | number;
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | React.ReactNode;
  searchText?: string;
}

export interface GlassSelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: any, event?: any) => void;
  options: GlassSelectOption[];
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  shape?: 'pill' | 'rounded';
  placement?: 'bottom' | 'top';
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  name?: string;
}

// Helper to normalize Vietnamese characters for search
function normalizeSearchText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  label,
  error,
  placeholder = 'Chọn một mục...',
  value,
  defaultValue,
  onChange,
  options = [],
  disabled = false,
  searchable,
  searchPlaceholder = 'Tìm kiếm...',
  shape = 'pill',
  placement = 'bottom',
  className,
  triggerClassName,
  menuClassName,
  size = 'md',
  id,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalValue, setInternalValue] = useState<string | number>(
    value !== undefined ? value : (defaultValue !== undefined ? defaultValue : (options[0]?.value ?? ''))
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(internalValue));
  const isSearchEnabled = searchable !== undefined ? searchable : options.length > 5;

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const normalizedQuery = normalizeSearchText(searchQuery);

    return options.filter((opt) => {
      if (opt.searchText && normalizeSearchText(opt.searchText).includes(normalizedQuery)) {
        return true;
      }
      if (typeof opt.label === 'string' && normalizeSearchText(opt.label).includes(normalizedQuery)) {
        return true;
      }
      if (normalizeSearchText(String(opt.value)).includes(normalizedQuery)) {
        return true;
      }
      return false;
    });
  }, [options, searchQuery]);

  const handleSelect = (option: GlassSelectOption) => {
    if (disabled) return;
    setInternalValue(option.value);
    setIsOpen(false);

    if (onChange) {
      const syntheticEvent: any = {
        target: { value: option.value, name: name || id || '' },
        currentTarget: { value: option.value, name: name || id || '' },
        value: option.value,
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      syntheticEvent[Symbol.toPrimitive] = () => option.value;
      syntheticEvent.toString = () => String(option.value);
      syntheticEvent.valueOf = () => option.value;

      onChange(syntheticEvent, option.value);
    }
  };

  const sizeStyles = {
    sm: 'h-[32px] max-md:h-[40px] px-3 text-[0.8125rem] leading-[1.125rem]',
    md: 'h-[40px] max-md:h-[48px] px-4 text-[0.875rem] max-md:text-[1rem] leading-[1.375rem]',
    lg: 'h-[48px] max-md:h-[52px] px-4 text-[0.9375rem] max-md:text-[1rem] leading-[1.375rem]',
  };

  return (
    <div ref={containerRef} className={twMerge('w-full flex flex-col gap-[6px] relative select-none', className)}>
      {label && (
        <label data-role="field-label" className="text-[0.8125rem] leading-[1.125rem] font-medium text-[#68515E] dark:text-[#D8C9D2] block">
          {label}
        </label>
      )}

      {/* Trigger Button with Capsule / Rounded Shape */}
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={twMerge(
          clsx(
            'w-full flex items-center justify-between gap-2.5 text-left font-medium',
            shape === 'rounded' ? 'rounded-[16px]' : 'rounded-full',
            sizeStyles[size],
            'bg-white dark:bg-[#1E1E2A] border border-[#E5E7EB] dark:border-[#2D2D3C] shadow-2xs',
            'text-[#111827] dark:text-[#FFFFFF]',
            'transition-all duration-200 cursor-pointer outline-none active:scale-[0.98]',
            'hover:border-[#E27AA1]/60',
            isOpen && 'ring-2 ring-[#E27AA1]/20 border-[#E27AA1]',
            error && 'border-[#E11D48] ring-2 ring-[#E11D48]/20',
            disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
            triggerClassName
          )
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-[#E27AA1]">{selectedOption.icon}</span>
          )}
          <span className={clsx('truncate', !selectedOption && 'text-[#9CA3AF] dark:text-[#6B7280]')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0 ml-1">{selectedOption.badge}</span>
          )}
        </div>

        <ChevronDown
          className={clsx(
            'w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF] shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-[#E27AA1]'
          )}
        />
      </button>

      {/* Animated Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: placement === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: placement === 'top' ? -4 : 4 }}
            exit={{ opacity: 0, scale: 0.96, y: placement === 'top' ? 4 : -4 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28, mass: 0.8 }}
            className={twMerge(
              clsx(
                'absolute left-0 right-0 z-50',
                placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
                'rounded-2xl overflow-hidden',
                'bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634]',
                'shadow-lg shadow-black/5 dark:shadow-black/40',
                menuClassName
              )
            )}
            role="listbox"
          >
            {/* Search Box if enabled */}
            {isSearchEnabled && (
              <div className="p-2 border-b border-[#F0F1F4] dark:border-[#262634] bg-[#FAFAFC] dark:bg-[#1A1A26]">
                <div className="relative flex items-center">
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-8 py-2 rounded-full bg-white dark:bg-[#1E1E2A] border border-[#E5E7EB] dark:border-[#2D2D3C] text-[0.8125rem] text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#E27AA1]/30"
                  />
                  <Search className="w-4 h-4 absolute left-3 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none z-10" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 text-[#6B7280] hover:text-[#111827] p-1 rounded-full cursor-pointer z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Option List */}
            <div className="max-h-60 sm:max-h-72 overflow-y-auto p-1.5 space-y-1 overscroll-contain">
              {filteredOptions.length === 0 ? (
                <div className="py-6 px-3 text-center text-[0.75rem] text-[#9CA3AF] flex flex-col items-center gap-1.5">
                  <Search className="w-5 h-5 opacity-40 text-[#E27AA1]" />
                  <span>Không tìm thấy "{searchQuery}"</span>
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = String(option.value) === String(internalValue);

                  return (
                    <div
                      key={String(option.value)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      className={clsx(
                        'flex items-center justify-between gap-2 px-3.5 py-2.5 min-h-[40px] rounded-xl text-[0.8125rem] font-medium cursor-pointer transition-all active:scale-[0.98]',
                        isSelected
                          ? 'bg-gradient-to-r from-[#E27AA1] to-[#F092B5] text-white shadow-xs font-medium'
                          : 'text-[#2C1E26] dark:text-[#FFFFFF] hover:bg-white/30 hover:text-[#E27AA1] dark:hover:bg-white/10'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        {option.icon && (
                          <span className={clsx('shrink-0', isSelected ? 'text-white' : 'text-[#E27AA1]')}>
                            {option.icon}
                          </span>
                        )}
                        <span className="truncate">{option.label}</span>
                        {option.badge && (
                          <span className="shrink-0 ml-1">{option.badge}</span>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div data-role="caption" className="flex items-center gap-1.5 text-[0.75rem] leading-[1rem] font-normal text-[#E11D48]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 stroke-[1.75px]" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
