import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  CalendarDays,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Settings,
  MoreHorizontal,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { vi } from '../../i18n/vi';

export const GlassMobileNav: React.FC = () => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainItems = [
    { to: '/', label: vi.nav.dashboard, icon: LayoutDashboard },
    { to: '/cards', label: vi.nav.cards, icon: CreditCard },
    { to: '/transactions', label: vi.nav.transactions, icon: Receipt },
    { to: '/months', label: vi.nav.monthView, icon: CalendarDays },
  ];

  const moreItems = [
    { to: '/rules', label: vi.nav.rules, icon: Sparkles },
    { to: '/mcc', label: vi.nav.mcc, icon: BookOpen },
    { to: '/tracker', label: vi.nav.tracker, icon: ShieldCheck },
    { to: '/settings', label: vi.nav.settings, icon: Settings },
  ];

  return (
    <>
      {/* Slide-up More Sheet */}
      <AnimatePresence>
        {showMoreMenu && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative z-10 glass-surface-tier1 border-t border-white/60 dark:border-white/10 p-6 rounded-t-[32px] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <span className="font-semibold text-sm text-[#2C1E26] dark:text-[#FFFFFF]">
                  {vi.nav.more}
                </span>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(false)}
                  aria-label="Đóng menu"
                  className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 text-[#68515E] dark:text-[#D8C9D2] hover:bg-black/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowMoreMenu(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 p-3 rounded-full text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[#E27AA1] to-[#F092B5] text-white shadow-md'
                            : 'glass-surface-tier2 text-[#2C1E26] dark:text-[#D8C9D2] border border-white/40 dark:border-white/10'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Sticky Navigation Dock for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[64px] px-2 glass-surface-tier1 border-t border-white/50 dark:border-white/10 shadow-[0_-8px_32px_rgba(214,110,150,0.15)] flex items-center justify-around">
        {mainItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'text-[#E27AA1] font-semibold'
                    : 'text-[#68515E] dark:text-[#D8C9D2]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[56px] text-center">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setShowMoreMenu(true)}
          className="flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-full text-xs font-medium text-[#68515E] dark:text-[#D8C9D2]"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>{vi.nav.more}</span>
        </button>
      </nav>
    </>
  );
};
