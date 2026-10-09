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
        'glass-surface-dense rounded-[24px] flex flex-col h-full min-h-0 overflow-hidden relative',
        className
      )}
    >
      {/* Specular rim top highlight */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent z-10" />

      {/* Block Header (48px fixed height) */}
      {(title || tabs || actions) && (
        <div className="h-[48px] px-5 flex items-center justify-between border-b border-black/5 dark:border-white/10 shrink-0 bg-white/10 dark:bg-white/5">
          {/* Left: Title & Subtitle or Icon */}
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {icon && <div className="text-[#E27AA1] shrink-0">{icon}</div>}
            {title && (
              <div className="flex items-baseline gap-2 min-w-0">
                <h3
                  data-role="block-title"
                  className="text-[1rem] leading-[1.5rem] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] truncate tracking-tight"
                >
                  {title}
                </h3>
                {subtitle && (
                  <span
                    data-role="caption"
                    className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] truncate hidden sm:inline font-normal"
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
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-black/5 dark:bg-white/10 border border-white/20">
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
                          : 'text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] dark:hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {typeof tab.count === 'number' && (
                        <span
                          data-role="caption"
                          className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[0.75rem] leading-none ${
                            isActive ? 'bg-white/25 text-white' : 'bg-black/5 dark:bg-white/10 text-[#68515E] dark:text-[#D8C9D2]'
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

      {/* Block Body (Scrollable inside, min-h-0) */}
      <div
        className={twMerge(
          'flex-1 overflow-y-auto p-5 max-md:p-4 overscroll-contain min-h-0',
          bodyClassName
        )}
      >
        {children}
      </div>

      {/* Block Footer (Height 40px, font caption 12px) */}
      {footer && (
        <div
          data-role="caption"
          className={twMerge(
            'h-[40px] px-5 flex items-center justify-between border-t border-black/5 dark:border-white/10 bg-white/10 dark:bg-white/5 shrink-0 text-[0.75rem] leading-[1rem] font-normal text-[#68515E] dark:text-[#D8C9D2]',
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
