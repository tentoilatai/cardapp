import React, { useRef, useState } from 'react';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handlePointerLeave = () => {
    if (interactive) setMousePos(null);
  };

  const variantClasses = {
    default: 'glass-surface',
    soft: 'glass-surface',
    subtle: 'glass-surface-subtle',
    strong: 'glass-surface-strong',
    clear: 'glass-surface-clear',
    thick: 'glass-surface-thick',
    dense: 'glass-surface-dense',
    tint: 'glass-surface bg-pink-500/5 dark:bg-pink-950/20 border-pink-500/20',
    glow: 'glass-surface shadow-[0_8px_32px_rgba(226,122,161,0.22)]'
  };

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileHover={interactive ? { y: -4, scale: 1.008 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24, mass: 0.8 }}
      className={twMerge(
        clsx(
          'relative transition-shadow duration-300 p-6 rounded-[24px]',
          variantClasses[variant],
          interactive && 'cursor-pointer hover:shadow-[var(--glass-shadow-hover)]',
          className
        )
      )}
      {...props}
    >
      {/* Dynamic Specular Highlight tracking pointer */}
      {interactive && mousePos && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.45), transparent 70%)`
          }}
        />
      )}

      {/* Rim top-left light accent */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      
      {children}
    </motion.div>
  );
};
