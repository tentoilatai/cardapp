import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastOptions {
  message: string;
  variant?: ToastType | 'danger' | 'warning' | 'neutral' | string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (optionsOrMessage: string | ToastOptions, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      showToast: (msg: any) => console.log('Toast:', msg),
      success: (msg: string) => console.log('Success Toast:', msg),
      error: (msg: string) => console.error('Error Toast:', msg),
      info: (msg: string) => console.log('Info Toast:', msg),
    };
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (optionsOrMessage: string | ToastOptions, type: ToastType = 'success', duration: number = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let finalMessage = '';
      let finalType: ToastType = 'success';
      let finalDuration = duration;

      if (typeof optionsOrMessage === 'string') {
        finalMessage = optionsOrMessage;
        finalType = type;
      } else if (optionsOrMessage && typeof optionsOrMessage === 'object') {
        finalMessage = optionsOrMessage.message || '';
        const v = String(optionsOrMessage.variant || '');
        if (v === 'error' || v === 'danger') finalType = 'error';
        else if (v === 'info' || v === 'neutral') finalType = 'info';
        else finalType = 'success';
        if (optionsOrMessage.duration) finalDuration = optionsOrMessage.duration;
      }

      setToasts((prev) => [...prev, { id, type: finalType, message: finalMessage, duration: finalDuration }]);

      if (finalDuration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, finalDuration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  );
  const error = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast]
  );
  const info = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast Notification Container (Tier 1 Surface, Fixed Top-Right or Top-Center on mobile) */}
      <div
        data-testid="toast-container"
        className="fixed top-4 right-4 max-md:left-4 max-md:right-4 z-50 flex flex-col gap-2 pointer-events-none items-end max-md:items-center"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full glass-surface-tier1 shadow-[0_8px_24px_rgba(226,122,161,0.22)] border border-white/60 dark:border-white/15 min-w-[240px] max-w-md"
              >
                {isSuccess && (
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 stroke-[2px]" />
                )}
                {isError && (
                  <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0 stroke-[2px]" />
                )}
                {!isSuccess && !isError && (
                  <Info className="w-4 h-4 text-[#E27AA1] shrink-0 stroke-[2px]" />
                )}

                <span className="text-[0.8125rem] leading-[1.125rem] font-medium text-[#2C1E26] dark:text-[#FFFFFF] flex-1 truncate">
                  {toast.message}
                </span>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  aria-label="Đóng thông báo"
                >
                  <X className="w-3.5 h-3.5 stroke-[1.75px]" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
