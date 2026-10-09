import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  testId?: string;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '840px',
  testId,
}) => {
  const { isMobile } = useBreakpoint();

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
          data-testid={testId || 'detail-drawer'}
          data-role="detail-drawer"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
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
          />

          {/* Centered Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{ width: isMobile ? '100%' : width, maxWidth: '100%' }}
            className="relative z-10 w-full max-h-[92vh] bg-white dark:bg-[#181822] border border-[#E5E7EB] dark:border-[#262634] rounded-2xl shadow-xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="min-h-[60px] px-6 sm:px-7 py-3.5 flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#262634] shrink-0 bg-gray-50/50 dark:bg-[#15151E]/60">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                {isMobile && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 -ml-1 rounded-full text-[#68515E] hover:text-[#2C1E26] dark:text-[#D8C9D2] dark:hover:text-white hover:bg-black/5 touch-target flex items-center justify-center cursor-pointer"
                    aria-label="Quay lại"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[1.75px]" />
                  </button>
                )}
                <div className="min-w-0">
                  <h3 data-role="block-title" className="text-[1rem] leading-[1.5rem] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] truncate tracking-tight">
                    {title}
                  </h3>
                  {subtitle && (
                    <p data-role="caption" className="text-[0.75rem] leading-[1rem] font-normal text-[#68515E] dark:text-[#D8C9D2] truncate mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full text-[#68515E] hover:text-[#2C1E26] dark:text-[#D8C9D2] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors touch-target flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Đóng"
              >
                <X className="w-5 h-5 stroke-[1.75px]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-5 space-y-4 overscroll-contain min-h-0 text-[#2C1E26] dark:text-[#FFFFFF]">
              {children}
            </div>

            {/* Modal Footer */}
            {footer && (
              <div className="border-t border-[#E5E7EB] dark:border-[#262634] bg-gray-50/50 dark:bg-[#15151E]/60 shrink-0 pb-safe">
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
