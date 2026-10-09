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
  LogOut,
  User,
  KeyRound
} from 'lucide-react';
import { vi } from '../../i18n/vi';
import { useAuth } from '../../context/AuthContext';
import { BottomSheet } from './BottomSheet';

export const BottomNav: React.FC = () => {
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const { user, logout } = useAuth();

  const mainItems = [
    { to: '/', label: vi.nav.dashboard, icon: LayoutDashboard },
    { to: '/cards', label: vi.nav.cards, icon: CreditCard },
    { to: '/transactions', label: vi.nav.transactions, icon: Receipt },
    { to: '/monthly-view', label: vi.nav.monthView, icon: CalendarDays },
  ];

  const moreItems = [
    { to: '/cashback-rules', label: vi.nav.rules, icon: Sparkles, desc: 'Tỷ lệ hoàn tiền & điều kiện thẻ' },
    { to: '/category-codes', label: vi.nav.mcc, icon: BookOpen, desc: 'Tra cứu danh mục mã ngành' },
    { to: '/card-tracking', label: vi.nav.tracker, icon: ShieldCheck, desc: 'Theo dõi hạn mức & sao kê' },
    { to: '/settings', label: vi.nav.settings, icon: Settings, desc: 'Cấu hình ngưỡng & tài khoản' },
    { to: '/change-password', label: vi.nav.changePassword, icon: KeyRound, desc: 'Cập nhật mật khẩu bảo mật' },
  ];

  const handleLogout = async () => {
    setShowMoreSheet(false);
    await logout();
  };

  return (
    <>
      {/* 5-item Mobile/Tablet Bottom Navigation Bar (< 1024px) */}
      <nav
        data-testid="bottom-nav"
        className="lg:hidden !fixed bottom-0 left-0 right-0 z-40 h-[calc(60px+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 dark:bg-[#161620]/95 border-t border-[#E8EAEF] dark:border-[#262634] rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center justify-around px-1.5 select-none relative overflow-hidden backdrop-blur-md"
      >
        {mainItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 flex-1 max-w-[70px] h-[48px] rounded-xl text-[0.75rem] leading-[1rem] font-medium transition-transform active:scale-[0.94] touch-target select-none ${
                  isActive
                    ? 'text-[#E27AA1] font-semibold'
                    : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-1.5 inset-y-1 bg-pink-500/10 dark:bg-pink-500/20 rounded-xl -z-10"
                    />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'stroke-[2.2px] scale-105 text-[#E27AA1]' : 'stroke-[1.75px]'}`} />
                  <span className="truncate max-w-[62px] text-center leading-tight">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* 5th Tab: "Khác" Button */}
        <button
          type="button"
          data-testid="bottom-nav-more"
          onClick={() => setShowMoreSheet(true)}
          className="relative flex flex-col items-center justify-center gap-0.5 flex-1 max-w-[70px] h-[48px] rounded-xl text-[0.75rem] leading-[1rem] font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] transition-transform active:scale-[0.94] touch-target select-none cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5 shrink-0 stroke-[1.75px]" />
          <span className="truncate max-w-[62px] text-center leading-tight">
            {vi.nav.more}
          </span>
        </button>
      </nav>

      {/* Slide-up BottomSheet for "Khác" Menu */}
      <BottomSheet
        isOpen={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        title={vi.nav.more}
        testId="bottom-nav-sheet"
        footer={
          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-[48px] flex items-center justify-center gap-2 px-5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.97] text-[#E11D48] font-medium text-[0.875rem] leading-[1.375rem] transition-all touch-target cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0 stroke-[1.75px]" />
            <span>{vi.nav.logout}</span>
          </button>
        }
      >
        <div className="space-y-3">
          {/* User Profile Card */}
          {user && (
            <div className="h-[48px] flex items-center gap-3 px-4 rounded-xl bg-[#F8F9FA] dark:bg-[#1E1E2A] border border-[#E8EAEF] dark:border-[#2D2D3C] shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#E27AA1]/15 text-[#E27AA1] flex items-center justify-center font-semibold text-[0.8125rem] shrink-0">
                <User className="w-4 h-4 stroke-[1.75px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.8125rem] font-medium text-[#111827] dark:text-[#FFFFFF] truncate">
                  {user.username}
                </div>
                <div className="text-[0.75rem] leading-[1rem] text-[#6B7280] dark:text-[#9CA3AF] truncate">
                  {user.roles?.includes('Admin') ? 'Quản trị viên' : 'Người dùng'}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links List */}
          <div className="space-y-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowMoreSheet(false)}
                  className={({ isActive }) =>
                    `h-[48px] flex items-center gap-3 px-4 rounded-full text-[0.875rem] font-medium transition-all active:scale-[0.98] touch-target ${
                      isActive
                        ? 'bg-gradient-to-r from-[#E27AA1] to-[#F092B5] text-white shadow-xs'
                        : 'bg-white dark:bg-[#1E1E2A] text-[#111827] dark:text-[#FFFFFF] border border-[#E8EAEF] dark:border-[#2D2D3C] hover:bg-[#F9FAFB]'
                    }`
                  }
                >
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 stroke-[1.75px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate text-[0.875rem] leading-[1.375rem]">{item.label}</div>
                    <div className="text-[0.75rem] leading-[1rem] opacity-75 truncate">{item.desc}</div>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
