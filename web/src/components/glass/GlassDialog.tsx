import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
}

export const GlassDialog: React.FC<GlassDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  maxWidth = 'lg',
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#140811]/30 dark:bg-black/50 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.9 }}
            className={twMerge(
              clsx(
                'relative w-full bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] p-6 sm:p-8 z-10 my-8 rounded-2xl shadow-xl overflow-hidden',
                maxWidthStyles[maxWidth]
              )
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                {title && <h3 data-role="block-title" className="text-[1rem] leading-[1.5rem] font-semibold text-[#111827] dark:text-[#FFFFFF]">{title}</h3>}
                {description && <p data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#6B7280] dark:text-[#9CA3AF] mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5 stroke-[1.75px]" />
              </button>
            </div>

            {/* Body */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
