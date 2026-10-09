import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  CalendarDays,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Settings,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { vi } from '../../i18n/vi';
import { useAuth } from '../../context/AuthContext';
import { GlassButton } from '../glass/GlassButton';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: vi.nav.dashboard, icon: LayoutDashboard },
  { to: '/cards', label: vi.nav.cards, icon: CreditCard },
  { to: '/transactions', label: vi.nav.transactions, icon: Receipt },
  { to: '/monthly-view', label: vi.nav.monthView, icon: CalendarDays },
  { to: '/cashback-rules', label: vi.nav.rules, icon: Sparkles },
  { to: '/category-codes', label: vi.nav.mcc, icon: BookOpen },
  { to: '/card-tracking', label: vi.nav.tracker, icon: ShieldCheck },
  { to: '/settings', label: vi.nav.settings, icon: Settings },
];

export const GlassSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      data-testid="desktop-sidebar"
      className="hidden lg:flex flex-col shrink-0 z-40 w-[240px] my-3 ml-3 h-[calc(100dvh-24px)] rounded-2xl overflow-hidden glass-surface-tier1 select-none relative"
    >
      {/* Specular rim top highlight */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/75 to-transparent z-10" />

      {/* Brand Header */}
      <div className="h-[64px] px-5 flex items-center gap-3 border-b border-black/5 dark:border-white/10 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E27AA1] to-[#F8C8DC] flex items-center justify-center text-white shadow-md shadow-[#E27AA1]/25 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex flex-col truncate">
          <span className="font-semibold text-[0.875rem] leading-[1.375rem] text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight">
            {vi.app.name}
          </span>
          <span data-role="caption" className="text-[0.75rem] leading-[1rem] font-normal text-[#68515E] dark:text-[#D8C9D2]">
            {vi.app.fullName.split('&')[1]?.trim() || 'Hoàn tiền'}
          </span>
        </div>
      </div>

      {/* Navigation Links (Fixed 8 items, each 44px) */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3.5 h-[44px] rounded-full text-[0.8125rem] leading-[1.125rem] font-medium transition-all select-none group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#E27AA1] to-[#F092B5] text-white font-semibold shadow-sm shadow-[#E27AA1]/35'
                    : 'text-[#4A3540] dark:text-[#D1C3CB] hover:text-[#2C1E26] dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 stroke-[1.75px]" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-black/5 dark:border-white/10 shrink-0 space-y-2">
        <div className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-white/20 dark:bg-white/5 border border-white/40 dark:border-white/10">
          <div className="w-7 h-7 rounded-full bg-[#E27AA1]/15 text-[#E27AA1] flex items-center justify-center shrink-0">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col truncate min-w-0">
            <span className="text-[0.8125rem] font-medium text-[#2C1E26] dark:text-[#FFFFFF] truncate">
              {user?.username || 'Quản trị viên'}
            </span>
            <span data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2]">
              {user?.roles?.[0] || 'Admin'}
            </span>
          </div>
        </div>

        <GlassButton
          variant="ghost"
          size="md"
          onClick={handleLogout}
          icon={<LogOut className="w-4 h-4" />}
          className="w-full text-[0.8125rem] text-[#E11D48] hover:bg-rose-500/10 hover:text-[#E11D48] rounded-full justify-start cursor-pointer"
        >
          <span>{vi.nav.logout}</span>
        </GlassButton>
      </div>
    </aside>
  );
};
