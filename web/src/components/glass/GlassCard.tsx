import React from 'react';
import { motion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'subtle' | 'soft' | 'strong' | 'glow' | 'tint' | 'clear' | 'thick' | 'dense';
  interactive?: boolean;
  glowColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  interactive = false,
  className,
  children,
  ...props
}) => {
  const variantClasses = {
    default: 'bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-xs',
    soft: 'bg-white/80 dark:bg-[#181822]/80 border border-[#E8EAEF] dark:border-[#262634] shadow-xs',
    subtle: 'bg-[#F9FAFC] dark:bg-[#14141C] border border-[#E8EAEF] dark:border-[#20202C]',
    strong: 'bg-white dark:bg-[#1E1E2A] border border-[#E8EAEF] dark:border-[#262634] shadow-sm',
    clear: 'bg-white/90 dark:bg-[#181822]/90 border border-[#E8EAEF] dark:border-[#262634] shadow-xs backdrop-blur-md',
    thick: 'bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-sm',
    dense: 'bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-xs',
    tint: 'bg-pink-500/5 dark:bg-pink-950/20 border border-pink-500/20 shadow-xs',
    glow: 'bg-white dark:bg-[#181822] border border-pink-500/20 shadow-[0_4px_20px_rgba(226,122,161,0.15)]'
  };

  return (
    <motion.div
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={twMerge(
        clsx(
          'relative transition-all duration-200 p-5 rounded-[24px]',
          variantClasses[variant],
          interactive && 'cursor-pointer hover:border-[#E27AA1]/40 hover:shadow-md',
          className
        )
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

