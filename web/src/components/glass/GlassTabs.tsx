import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface GlassTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const GlassTabs: React.FC<GlassTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div
      data-role="tabs-group"
      className={twMerge(
        'inline-flex items-center p-1 rounded-full bg-[#E5E7EB]/60 dark:bg-[#1E1E2A] border border-[#E5E7EB] dark:border-[#2D2D3C] h-[40px] max-md:h-[44px]',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'relative h-[32px] max-md:h-[36px] px-3.5 text-[0.8125rem] leading-[1.125rem] font-medium rounded-full',
              'transition-colors select-none flex items-center gap-2 z-10 touch-target cursor-pointer',
              isActive
                ? 'text-[#111827] dark:text-[#FFFFFF]'
                : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 bg-white dark:bg-[#2A2A38] rounded-full shadow-xs border border-black/5 dark:border-white/10 -z-10"
              />
            )}
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge != null && (
              <span
                data-role="caption"
                className={clsx(
                  'text-[0.75rem] leading-[1rem] px-1.5 py-0.5 rounded-full font-medium',
                  isActive
                    ? 'bg-pink-500/15 text-[#E27AA1]'
                    : 'bg-black/5 dark:bg-white/10 text-[#6B7280] dark:text-[#9CA3AF]'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface GlassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const GlassSwitch: React.FC<GlassSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <label
      className={clsx(
        'inline-flex items-center gap-3 cursor-pointer select-none touch-target',
        disabled && 'opacity-40 pointer-events-none'
      )}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'w-11 h-6 rounded-full p-0.5 transition-colors duration-200 border border-white/60 dark:border-white/20 shadow-inner relative flex items-center',
          checked ? 'bg-[#E27AA1]' : 'bg-black/10 dark:bg-white/10'
        )}
      >
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="w-5 h-5 rounded-full bg-white shadow-sm"
        />
      </div>
      {label && (
        <span className="text-[0.875rem] leading-[1.375rem] font-normal text-[#2C1E26] dark:text-[#FFFFFF]">
          {label}
        </span>
      )}
    </label>
  );
};
