import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { GlassButton } from './GlassButton';

export interface GlassDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const GlassDrawer: React.FC<GlassDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-xl'
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Slide-in Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            className={`relative w-full ${width} h-full bg-white dark:bg-[#181822] rounded-l-[32px] border-l border-[#E8EAEF] dark:border-[#262634] shadow-2xl flex flex-col z-10 overflow-hidden`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#F0F1F4] dark:border-[#262634] flex items-start justify-between gap-4 shrink-0">
              <div>
                <h2 data-role="block-title" className="text-[1rem] leading-[1.5rem] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 font-normal">
                    {subtitle}
                  </p>
                )}
              </div>

              <GlassButton
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Đóng ngăn kéo"
                className="shrink-0 -mr-2 -mt-1 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white"
              >
                <X className="w-5 h-5 stroke-[1.75px]" />
              </GlassButton>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
