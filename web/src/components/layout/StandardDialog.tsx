import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { BottomSheet } from './BottomSheet';

export interface StandardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg'; // sm = 480px, md = 560px, lg = 720px
  children: React.ReactNode;
  footer?: React.ReactNode;
  testId?: string;
}

export const StandardDialog: React.FC<StandardDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'sm',
  children,
  footer,
  testId,
}) => {
  const { isMobile } = useBreakpoint();

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

  // On Mobile, sm/md dialogs automatically transform into BottomSheet
  if (isMobile && size !== 'lg') {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        footer={footer}
        testId={testId}
      >
        {subtitle && (
          <p data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] -mt-2 mb-2 font-normal">
            {subtitle}
          </p>
        )}
        {children}
      </BottomSheet>
    );
  }

  const maxWidthClass =
    size === 'lg' ? 'max-w-[720px]' : size === 'md' ? 'max-w-[560px]' : 'max-w-[480px]';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-testid={testId || 'standard-dialog'}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#140811]/30 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`relative z-10 w-full ${maxWidthClass} max-h-[90dvh] bg-white dark:bg-[#181822] border border-[#E5E7EB] dark:border-[#262634] rounded-2xl shadow-xl flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="min-h-[60px] px-6 sm:px-7 py-3.5 flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#262634] shrink-0 bg-gray-50/50 dark:bg-[#15151E]/60">
              <div className="pr-4 min-w-0">
                <h3 data-role="block-title" className="text-[1rem] leading-[1.5rem] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p data-role="caption" className="text-[0.75rem] leading-[1rem] font-normal text-[#68515E] dark:text-[#D8C9D2] mt-0.5 leading-relaxed">
                    {subtitle}
                  </p>
                )}
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-5 space-y-4 overscroll-contain min-h-0 text-[#2C1E26] dark:text-[#FFFFFF]">
              {children}
            </div>

            {/* Footer */}
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
};
