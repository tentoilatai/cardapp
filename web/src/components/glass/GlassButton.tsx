import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  magnetic?: boolean;
  shape?: 'pill' | 'rounded';
  className?: string;
  children?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  iconOnly = false,
  icon,
  leftIcon,
  rightIcon,
  magnetic = false,
  shape = 'pill',
  disabled,
  className,
  children,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isButtonLoading = isLoading || loading;
  const buttonLeftIcon = leftIcon || icon;
  const effectiveSize = iconOnly ? 'icon' : size;

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Disable magnetic on coarse pointer (touch devices)
    if (!magnetic || disabled || isButtonLoading || !btnRef.current || e.pointerType === 'touch') return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Limit displacement to max 3px per specification
    const rawX = (e.clientX - centerX) * 0.1;
    const rawY = (e.clientY - centerY) * 0.1;
    const distanceX = Math.max(-3, Math.min(3, rawX));
    const distanceY = Math.max(-3, Math.min(3, rawY));
    setOffset({ x: distanceX, y: distanceY });
  };

  const handlePointerLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  const handleBlur = () => {
    setOffset({ x: 0, y: 0 });
  };

  const baseStyles =
    'inline-flex items-center justify-center font-medium select-none transition-all outline-none focus-visible:ring-3 focus-visible:ring-[#E27AA1]/40 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] cursor-pointer touch-target shrink-0 rounded-full';

  const sizeStyles = {
    sm: 'h-[32px] max-md:h-[40px] px-3 min-w-[64px] text-[0.8125rem] leading-[1.125rem] gap-1.5',
    md: 'h-[40px] max-md:h-[44px] px-4 min-w-[88px] text-[0.875rem] max-md:text-[0.9375rem] leading-[1.375rem] gap-2',
    lg: 'h-[48px] max-md:h-[52px] px-6 min-w-[88px] text-[0.9375rem] max-md:text-[1rem] leading-[1.375rem] gap-2.5',
    icon: 'w-[32px] h-[32px] max-md:w-[40px] max-md:h-[40px] p-0 min-w-0 aspect-square',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[#E27AA1] to-[#F092B5] text-white font-medium shadow-[0_6px_20px_rgba(226,122,161,0.35),inset_0_1.5px_0_rgba(255,255,255,0.65)] hover:shadow-[0_8px_26px_rgba(226,122,161,0.48)] hover:brightness-105 border border-white/35',
    secondary:
      'bg-white/20 dark:bg-white/10 text-[#2C1E26] dark:text-[#FFFFFF] font-medium border border-white/50 dark:border-white/15 shadow-[0_2px_8px_rgba(226,122,161,0.06),inset_0_1px_1px_rgba(255,255,255,0.5)] hover:bg-white/35 dark:hover:bg-white/20',
    ghost:
      'bg-transparent hover:bg-white/25 dark:hover:bg-white/10 text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] dark:hover:text-white border border-transparent hover:border-white/20',
    danger:
      'bg-gradient-to-r from-[#E11D48] to-[#F43F5E] text-white font-medium shadow-[0_6px_20px_rgba(225,29,72,0.30),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_8px_24px_rgba(225,29,72,0.45)] border border-white/25',
    outline:
      'bg-transparent text-[#E27AA1] font-medium border border-[#E27AA1]/60 hover:bg-[#E27AA1]/12',
  };

  return (
    <motion.button
      ref={btnRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onBlur={handleBlur}
      animate={magnetic ? { x: offset.x, y: offset.y } : undefined}
      whileTap={{ scale: disabled || isButtonLoading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      disabled={disabled || isButtonLoading}
      className={twMerge(
        clsx(
          baseStyles,
          sizeStyles[effectiveSize],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {isButtonLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
          {children && <span className="truncate">{children}</span>}
        </>
      ) : (
        <>
          {buttonLeftIcon && <span className="shrink-0 flex items-center">{buttonLeftIcon}</span>}
          {children && <span className="truncate">{children}</span>}
          {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

export interface IconButtonProps extends Omit<GlassButtonProps, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  size = 'md',
  className,
  children,
  ...props
}) => {
  const iconSizeStyles = {
    sm: 'w-[32px] h-[32px] max-md:w-[40px] max-md:h-[40px] p-0 min-w-0 aspect-square rounded-full',
    md: 'w-[40px] h-[40px] max-md:h-[44px] max-md:w-[44px] p-0 min-w-0 aspect-square rounded-full',
    lg: 'w-[48px] h-[48px] max-md:w-[52px] max-md:h-[52px] p-0 min-w-0 aspect-square rounded-full',
  };

  return (
    <GlassButton
      size="icon"
      className={twMerge(clsx(iconSizeStyles[size], className))}
      {...props}
    >
      {children}
    </GlassButton>
  );
};
