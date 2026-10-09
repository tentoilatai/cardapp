import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface GlassBlockTab {
  id: string;
  label: string;
  count?: number;
}

export interface GlassBlockProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: GlassBlockTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  testId?: string;
}

export const GlassBlock: React.FC<GlassBlockProps> = ({
  title,
  subtitle,
  icon,
  actions,
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
  className = '',
  bodyClassName = '',
  footerClassName = '',
  testId,
}) => {
  return (
    <div
      data-testid={testId || 'glass-block'}
      className={twMerge(
        'bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] rounded-[24px] shadow-xs flex flex-col h-full min-h-0 overflow-hidden relative',
        className
      )}
    >
      {/* Block Header */}
      {(title || tabs || actions) && (
        <div className="h-[48px] px-5 flex items-center justify-between border-b border-[#F0F1F4] dark:border-[#262634] shrink-0 bg-[#FAFAFC] dark:bg-[#1A1A26]">
          {/* Left: Title & Subtitle or Icon */}
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {icon && <div className="text-[#E27AA1] shrink-0">{icon}</div>}
            {title && (
              <div className="flex items-baseline gap-2 min-w-0">
                <h3
                  data-role="block-title"
                  className="text-[1rem] leading-[1.5rem] font-semibold text-[#111827] dark:text-[#FFFFFF] truncate tracking-tight"
                >
                  {title}
                </h3>
                {subtitle && (
                  <span
                    data-role="caption"
                    className="text-[0.75rem] leading-[1rem] text-[#6B7280] dark:text-[#9CA3AF] truncate hidden sm:inline font-normal"
                  >
                    {subtitle}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Tabs or Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {tabs && tabs.length > 0 && (
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-[#E5E7EB]/60 dark:bg-[#262634] border border-[#E5E7EB] dark:border-[#2D2D3C]">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange?.(tab.id)}
                      className={`h-[28px] px-3 rounded-full text-[0.8125rem] leading-[1.125rem] font-medium transition-all touch-target cursor-pointer flex items-center ${
                        isActive
                          ? 'bg-[#E27AA1] text-white shadow-xs'
                          : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {typeof tab.count === 'number' && (
                        <span
                          data-role="caption"
                          className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[0.75rem] leading-none ${
                            isActive ? 'bg-white/25 text-white' : 'bg-black/5 dark:bg-white/10 text-[#6B7280] dark:text-[#9CA3AF]'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Block Body */}
      <div
        className={twMerge(
          'flex-1 overflow-y-auto p-5 max-md:p-4 overscroll-contain min-h-0',
          bodyClassName
        )}
      >
        {children}
      </div>

      {/* Block Footer */}
      {footer && (
        <div
          data-role="caption"
          className={twMerge(
            'h-[40px] px-5 flex items-center justify-between border-t border-[#F0F1F4] dark:border-[#262634] bg-[#FAFAFC] dark:bg-[#1A1A26] shrink-0 text-[0.75rem] leading-[1rem] font-normal text-[#6B7280] dark:text-[#9CA3AF]',
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

