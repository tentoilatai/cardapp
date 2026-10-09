import React from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export type LayoutTemplate =
  | 'single-table'
  | 'stats-two-blocks'
  | 'two-equal-blocks'
  | 'form';

export interface StandardPageProps {
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  monthPicker?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  layoutTemplate?: LayoutTemplate;
  children: React.ReactNode;
  testId?: string;
}

export const StandardPage: React.FC<StandardPageProps> = ({
  title,
  description,
  primaryAction,
  monthPicker,
  toolbar,
  footer,
  layoutTemplate = 'single-table',
  children,
  testId,
}) => {
  const { isTouch } = useBreakpoint();

  // MOBILE & TABLET LAYOUT (< 1024px)
  if (isTouch) {
    return (
      <div
        data-testid={testId || 'standard-page'}
        className="flex flex-col w-full min-h-[calc(100dvh-64px)] pb-[calc(var(--bottom-nav-height)+24px)] pt-safe px-4"
      >
        {/* VÙNG A: Compact Sticky Topbar on Mobile (56px) */}
        <header
          data-region="topbar"
          className="sticky top-0 z-30 h-[56px] -mx-4 px-4 glass-surface-clear border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs shrink-0"
        >
          <div className="min-w-0 flex-1">
            <h1 data-role="page-title" className="text-[18px] leading-[26px] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight truncate">
              {title}
            </h1>
          </div>
          {primaryAction && (
            <div className="shrink-0 flex items-center">
              {primaryAction}
            </div>
          )}
        </header>

        {/* Optional Month Picker Row (44px) directly under Topbar */}
        {monthPicker && (
          <div
            data-testid="mobile-month-picker-row"
            className="h-[44px] my-1 flex items-center justify-center shrink-0"
          >
            {monthPicker}
          </div>
        )}

        {/* VÙNG B: Mobile Toolbar */}
        {toolbar && (
          <div
            data-region="toolbar"
            className="py-2.5 shrink-0"
          >
            {toolbar}
          </div>
        )}

        {/* VÙNG C: Content Area */}
        <main
          data-region="content"
          className="flex-1 w-full my-2 space-y-4"
        >
          {children}
        </main>

        {/* VÙNG D: Mobile Footer / Pagination */}
        {footer && (
          <footer
            data-region="footer"
            className="pt-2 shrink-0"
          >
            {footer}
          </footer>
        )}
      </div>
    );
  }

  // DESKTOP LAYOUT (>= 1024px): Strictly no whole-page scroll, exact 4 regions
  return (
    <div
      data-testid={testId || 'standard-page'}
      className="h-full w-full max-w-[1440px] mx-auto px-6 grid grid-rows-[64px_56px_1fr_48px] overflow-hidden"
    >
      {/* VÙNG A: data-region="topbar" (64px fixed) */}
      <header
        data-region="topbar"
        className="h-[64px] flex items-center justify-between gap-4 border-b border-black/5 dark:border-white/10 shrink-0 select-none"
      >
        {/* Left: Page Title */}
        <div className="w-72 shrink-0">
          <h1 data-role="page-title" className="text-[20px] leading-[28px] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight truncate">
            {title}
          </h1>
        </div>

        {/* Center-Right: Month Picker (Slot stays aligned across all pages) */}
        <div className="flex-1 flex justify-center max-w-sm mx-auto">
          {monthPicker || <div className="h-9 w-full" aria-hidden="true" />}
        </div>

        {/* Far-Right: Primary Action Button (Slot stays pinned on far right) */}
        <div className="w-56 flex justify-end shrink-0">
          {primaryAction || <div className="h-9 w-24" aria-hidden="true" />}
        </div>
      </header>

      {/* VÙNG B: data-region="toolbar" (56px fixed) */}
      <div
        data-region="toolbar"
        className="h-[56px] flex items-center justify-between gap-4 shrink-0"
      >
        {toolbar ? (
          <div className="w-full flex items-center justify-between gap-4">
            {toolbar}
          </div>
        ) : (
          <div data-role="caption" className="text-[12px] leading-[16px] text-[#68515E] dark:text-[#D8C9D2] font-normal truncate">
            {description || '—'}
          </div>
        )}
      </div>

      {/* VÙNG C: data-region="content" (1fr, min-height 0, scrollable internally) */}
      <main
        data-region="content"
        className="min-h-0 h-full w-full py-1 overflow-hidden"
      >
        {layoutTemplate === 'single-table' && (
          <div className="w-full h-full min-h-0">
            {children}
          </div>
        )}

        {layoutTemplate === 'stats-two-blocks' && (
          <div className="w-full h-full min-h-0 flex flex-col gap-[var(--block-gap,16px)]">
            {children}
          </div>
        )}

        {layoutTemplate === 'two-equal-blocks' && (
          <div className="w-full h-full min-h-0 grid grid-cols-12 gap-[var(--block-gap,16px)]">
            {children}
          </div>
        )}

        {layoutTemplate === 'form' && (
          <div className="w-full h-full min-h-0">
            {children}
          </div>
        )}
      </main>

      {/* VÙNG D: data-region="footer" (48px fixed) */}
      <footer
        data-region="footer"
        className="h-[48px] flex items-center justify-between border-t border-black/5 dark:border-white/10 shrink-0"
      >
        {footer || <div className="h-6" aria-hidden="true" />}
      </footer>
    </div>
  );
};
