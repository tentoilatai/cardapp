import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { formatMonthKey, getMonthKeyNow } from '../../lib/formatters';

export interface GlassMonthPickerProps {
  value: number; // YYYYMM, e.g. 202610
  onChange: (monthKey: number) => void;
  className?: string;
  isLoading?: boolean;
}

export const GlassMonthPicker: React.FC<GlassMonthPickerProps> = ({
  value,
  onChange,
  className = '',
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = Math.floor(value / 100);
  const currentMonth = value % 100;

  const [viewYear, setViewYear] = useState<number>(currentYear);

  useEffect(() => {
    setViewYear(Math.floor(value / 100));
  }, [value]);

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

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    let y = currentYear;
    let m = currentMonth - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    onChange(y * 100 + m);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    let y = currentYear;
    let m = currentMonth + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange(y * 100 + m);
  };

  const handleSelectMonth = (month: number) => {
    const newKey = viewYear * 100 + month;
    onChange(newKey);
    setIsOpen(false);
  };

  const handleJumpToCurrentMonth = () => {
    const nowKey = getMonthKeyNow();
    onChange(nowKey);
    setViewYear(Math.floor(nowKey / 100));
    setIsOpen(false);
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  const nowKey = getMonthKeyNow();

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Pill Capsule Control */}
      <div className="flex items-center bg-white/20 dark:bg-white/10 p-0.5 rounded-full border border-white/60 dark:border-white/15 shadow-2xs transition-all hover:border-[#E27AA1]/50 h-[40px] max-md:h-[44px]">
        {/* Prev Month Button */}
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-8 h-8 max-md:w-10 max-md:h-10 flex items-center justify-center rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer touch-target active:scale-95"
          title="Tháng trước"
          aria-label="Tháng trước"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.75px]" />
        </button>

        {/* Dropdown Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1 h-8 max-md:h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer select-none active:scale-95"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-[#E27AA1] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Calendar className="w-4 h-4 text-[#E27AA1]" />
          )}
          <span className="font-medium text-[0.875rem] max-md:text-[0.9375rem] leading-[1.375rem] text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums">
            {formatMonthKey(value)}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#68515E] dark:text-[#D8C9D2] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#E27AA1]' : ''
            }`}
          />
        </button>

        {/* Next Month Button */}
        <button
          type="button"
          onClick={handleNextMonth}
          className="w-8 h-8 max-md:w-10 max-md:h-10 flex items-center justify-center rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer touch-target active:scale-95"
          title="Tháng sau"
          aria-label="Tháng sau"
        >
          <ChevronRight className="w-4 h-4 stroke-[1.75px]" />
        </button>
      </div>

      {/* Glass Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 4 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-1.5 z-50 w-72 p-3.5 rounded-2xl glass-surface-tier1 shadow-[0_16px_40px_rgba(226,122,161,0.25)]"
          >
            {/* Year Selector Header */}
            <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-white/20 dark:border-white/10">
              <button
                type="button"
                onClick={() => setViewYear((y) => y - 1)}
                className="p-1.5 rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Năm trước"
                aria-label="Năm trước"
              >
                <ChevronLeft className="w-4 h-4 stroke-[1.75px]" />
              </button>

              <span className="text-[0.875rem] leading-[1.375rem] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums">
                Năm {viewYear}
              </span>

              <button
                type="button"
                onClick={() => setViewYear((y) => y + 1)}
                className="p-1.5 rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Năm sau"
                aria-label="Năm sau"
              >
                <ChevronRight className="w-4 h-4 stroke-[1.75px]" />
              </button>
            </div>

            {/* 4x3 Month Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {monthNames.map((name, idx) => {
                const monthNum = idx + 1;
                const itemKey = viewYear * 100 + monthNum;
                const isSelected = itemKey === value;
                const isCurrentMonth = itemKey === nowKey;

                return (
                  <button
                    key={monthNum}
                    type="button"
                    onClick={() => handleSelectMonth(monthNum)}
                    className={`h-[36px] px-2 text-[0.8125rem] leading-[1.125rem] font-medium rounded-xl transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#E27AA1] to-[#F092B5] text-white shadow-xs font-semibold'
                        : isCurrentMonth
                        ? 'bg-[#E27AA1]/15 text-[#E27AA1] border border-[#E27AA1]/30 hover:bg-[#E27AA1]/25'
                        : 'bg-white/25 dark:bg-white/5 text-[#2C1E26] dark:text-[#FFFFFF] hover:bg-white/45 dark:hover:bg-white/15'
                    }`}
                  >
                    <span>{name}</span>
                    {isCurrentMonth && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[#E27AA1] mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Current Month Shortcut */}
            <div className="mt-3 pt-2.5 border-t border-white/20 dark:border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={handleJumpToCurrentMonth}
                className="text-[0.75rem] leading-[1rem] font-medium text-[#E27AA1] hover:text-[#BF537B] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Về tháng hiện tại ({formatMonthKey(nowKey)})
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[0.75rem] leading-[1rem] font-normal text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
