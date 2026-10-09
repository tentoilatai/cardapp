import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export interface GlassSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const GlassSpinner: React.FC<GlassSpinnerProps> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const sizeMap = {
    sm: { container: 'w-6 h-6', ring: 'border-2', icon: 'w-3 h-3', text: 'text-[0.75rem]' },
    md: { container: 'w-10 h-10', ring: 'border-2.5', icon: 'w-4 h-4', text: 'text-[0.875rem]' },
    lg: { container: 'w-14 h-14', ring: 'border-3', icon: 'w-6 h-6', text: 'text-[1rem]' },
  };

  const s = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${s.container} flex items-center justify-center`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-full bg-[#E27AA1]/20 blur-md animate-pulse" />

        {/* Outer subtle ring track */}
        <div className={`absolute inset-0 rounded-full ${s.ring} border-white/60 dark:border-white/10`} />

        {/* Rotating gradient liquid arc */}
        <div
          className={`absolute inset-0 rounded-full ${s.ring} border-transparent border-t-[#E27AA1] border-r-[#D4668F] animate-spin`}
          style={{ animationDuration: '0.85s' }}
        />

        {/* Center glowing icon */}
        <Sparkles className={`${s.icon} text-[#E27AA1] animate-pulse`} />
      </div>

      {label && (
        <span className={`${s.text} font-medium text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight animate-pulse`}>
          {label}
        </span>
      )}
    </div>
  );
};

export interface GlassLoadingOverlayProps {
  isLoading: boolean;
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export const GlassLoadingOverlay: React.FC<GlassLoadingOverlayProps> = ({
  isLoading,
  label = 'Đang tải dữ liệu...',
  children,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-black/40 rounded-2xl"
        >
          <div className="glass-surface-tier1 px-6 py-4 rounded-full border border-white/60 dark:border-white/20 shadow-[0_12px_32px_rgba(226,122,161,0.18)] flex items-center gap-3">
            <GlassSpinner size="sm" />
            <span className="text-[0.8125rem] font-medium text-[#2C1E26] dark:text-[#FFFFFF]">
              {label}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
