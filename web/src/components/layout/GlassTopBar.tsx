import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { vi } from '../../i18n/vi';
import { formatMonthLabel, getCurrentMonthKey } from '../../lib/formatters';

interface GlassTopBarProps {
  title?: string;
  subtitle?: string;
  selectedMonth?: number;
  onMonthChange?: (newMonth: number) => void;
  actionButton?: React.ReactNode;
}

export const GlassTopBar: React.FC<GlassTopBarProps> = ({
  title,
  subtitle,
  selectedMonth = getCurrentMonthKey(),
  onMonthChange,
  actionButton,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine title from route if not provided
  let pageTitle = title;
  if (!pageTitle) {
    switch (location.pathname) {
      case '/':
        pageTitle = vi.nav.dashboard;
        break;
      case '/cards':
        pageTitle = vi.nav.cards;
        break;
      case '/transactions':
        pageTitle = vi.nav.transactions;
        break;
      case '/months':
        pageTitle = vi.nav.monthView;
        break;
      case '/rules':
        pageTitle = vi.nav.rules;
        break;
      case '/mcc':
        pageTitle = vi.nav.mcc;
        break;
      case '/tracker':
        pageTitle = vi.nav.tracker;
        break;
      case '/settings':
        pageTitle = vi.nav.settings;
        break;
      default:
        if (location.pathname.startsWith('/months/')) {
          pageTitle = vi.nav.monthView;
        } else {
          pageTitle = vi.app.name;
        }
    }
  }

  const handlePrevMonth = () => {
    const yr = Math.floor(selectedMonth / 100);
    const mo = selectedMonth % 100;
    let newYr = yr;
    let newMo = mo - 1;
    if (newMo < 1) {
      newMo = 12;
      newYr -= 1;
    }
    const newKey = newYr * 100 + newMo;
    if (onMonthChange) {
      onMonthChange(newKey);
    } else if (location.pathname.startsWith('/months')) {
      navigate(`/months/${newKey}`);
    }
  };

  const handleNextMonth = () => {
    const yr = Math.floor(selectedMonth / 100);
    const mo = selectedMonth % 100;
    let newYr = yr;
    let newMo = mo + 1;
    if (newMo > 12) {
      newMo = 1;
      newYr += 1;
    }
    const newKey = newYr * 100 + newMo;
    if (onMonthChange) {
      onMonthChange(newKey);
    } else if (location.pathname.startsWith('/months')) {
      navigate(`/months/${newKey}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[64px] px-5 md:px-7 rounded-2xl md:rounded-3xl flex items-center justify-between bg-white dark:bg-[#181822] border border-[#E5E7EB] dark:border-[#262634] shadow-xs relative overflow-hidden">

      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <h1 data-role="page-title" className="text-[18px] lg:text-[20px] leading-[26px] lg:leading-[28px] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight truncate">
          {pageTitle}
        </h1>
        {subtitle && (
          <span data-role="caption" className="hidden lg:inline text-[12px] leading-[16px] font-normal text-[#68515E] dark:text-[#D8C9D2] truncate">
            — {subtitle}
          </span>
        )}
      </div>

      {/* Right Controls: Month Selector & Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Rounded Pill Month Switcher */}
        <div className="flex items-center rounded-full glass-surface-clear p-1 shadow-xs border border-white/40 dark:border-white/10 h-[40px]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Tháng trước"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4 stroke-[1.75px]" />
          </button>
          
          <div className="flex items-center gap-1.5 px-3 text-[14px] leading-[22px] font-medium text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums select-none">
            <Calendar className="w-4 h-4 text-[#E27AA1]" />
            <span>{formatMonthLabel(selectedMonth)}</span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Tháng sau"
            aria-label="Tháng sau"
          >
            <ChevronRight className="w-4 h-4 stroke-[1.75px]" />
          </button>
        </div>

        {/* Primary Action Button (if provided) */}
        {actionButton && (
          <div className="hidden sm:block">
            {actionButton}
          </div>
        )}
      </div>
    </header>
  );
};
