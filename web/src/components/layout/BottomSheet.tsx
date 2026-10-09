import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  testId?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxHeight = '85dvh',
  testId,
}) => {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end"
          data-testid={testId || 'bottom-sheet'}
          data-role="bottom-sheet"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#140811]/30 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
            data-testid="bottom-sheet-backdrop"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            style={{ maxHeight }}
            className="relative z-10 w-full max-w-lg mx-auto bg-white dark:bg-[#181822] border-t border-x border-[#E5E7EB] dark:border-[#262634] rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden overscroll-contain pb-safe"
          >
            {/* Grab handle indicator */}
            <div className="pt-3 pb-1 cursor-grab active:cursor-grabbing flex justify-center">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            {/* Sheet Header */}
            {title && (
              <div className="px-5 py-3 flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#262634] shrink-0 bg-gray-50/50 dark:bg-[#15151E]/60">
                <h3 data-role="block-title" className="text-[1rem] leading-[1.5rem] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full text-[#68515E] hover:text-[#2C1E26] dark:text-[#D8C9D2] hover:bg-black/5 dark:hover:bg-white/10 transition-colors touch-target flex items-center justify-center cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5 stroke-[1.75px]" />
                </button>
              </div>
            )}

            {/* Sheet Body (scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain min-h-0 text-[#2C1E26] dark:text-[#FFFFFF]">
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <div className="border-t border-[#E5E7EB] dark:border-[#262634] bg-gray-50/50 dark:bg-[#15151E]/60 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
};
