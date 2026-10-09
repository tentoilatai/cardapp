import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassProgressProps {
  value: number; // 0 - 100
  max?: number;
  height?: number;
  variant?: 'pink' | 'purple' | 'success' | 'warning' | 'danger' | 'gradient';
  showLabel?: boolean;
  className?: string;
}

export const GlassProgress: React.FC<GlassProgressProps> = ({
  value,
  max = 100,
  height = 8,
  variant = 'pink',
  showLabel = false,
  className
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantGradients = {
    pink: 'from-[#E27AA1] to-[#F8C8DC]',
    purple: 'from-[#9C88FF] to-[#D6A2E8]',
    success: 'from-[#2E9E6B] to-[#6EE7B7]',
    warning: 'from-[#D9A21B] to-[#FCD34D]',
    danger: 'from-[#D64560] to-[#FCA5A5]',
    gradient: 'from-[#E27AA1] via-[#D9A21B] to-[#2E9E6B]'
  };

  return (
    <div className={twMerge('w-full flex flex-col gap-1.5', className)}>
      <div
        className="w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/60 dark:border-white/10 shadow-inner relative"
        style={{ height: `${height + 4}px` }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className={clsx(
            'h-full rounded-full bg-gradient-to-r relative overflow-hidden shadow-xs',
            variantGradients[variant]
          )}
        >
          {/* Shimmer reflection highlight moving through */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-[#826B76] dark:text-gray-300">
          <span>Tiến độ</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};
