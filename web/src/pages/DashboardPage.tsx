import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Percent,
  Plus,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { api } from '../lib/api';
import type { DashboardData, CardStatusSummary } from '../types';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  formatMonthLabel,
  getCurrentMonthKey
} from '../lib/formatters';
import { vi } from '../i18n/vi';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { StandardPage } from '../components/layout/StandardPage';
import { StatCard } from '../components/layout/StatCard';
import { GlassBlock } from '../components/layout/GlassBlock';
import { GlassBadge } from '../components/glass/GlassBadge';
import { GlassProgress } from '../components/glass/GlassProgress';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassMonthPicker } from '../components/glass/GlassMonthPicker';
import { GlassSpinner } from '../components/glass/GlassSpinner';
import { CountUp } from '../components/glass/CountUp';
import { DetailDrawer } from '../components/layout/DetailDrawer';

export const DashboardPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(getCurrentMonthKey());
  const [leftTab, setLeftTab] = useState<'spendingByCard' | 'monthlyTrends'>('spendingByCard');
  const [rightTab, setRightTab] = useState<'attention' | 'myCards'>('attention');
  const [selectedCardForDrawer, setSelectedCardForDrawer] = useState<CardStatusSummary | null>(null);
  const navigate = useNavigate();
  const { isTouch } = useBreakpoint();

  const { data, isLoading, isFetching, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', selectedMonth],
    queryFn: () => api.get<DashboardData>(`/api/dashboard?month=${selectedMonth}`),
    placeholderData: keepPreviousData,
  });

  if (isLoading && !data) {
    return (
      <StandardPage
        title={vi.dashboard.title}
        layoutTemplate="stats-two-blocks"
        monthPicker={
          <GlassMonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            isLoading={true}
          />
        }
      >
        <div className="w-full h-full flex flex-col items-center justify-center min-h-[320px]">
          <GlassSpinner size="lg" label="Đang tải dữ liệu tổng quan..." />
        </div>
      </StandardPage>
    );
  }

  if (error || !data) {
    return (
      <StandardPage
        title={vi.dashboard.title}
        layoutTemplate="stats-two-blocks"
      >
        <div className="p-8 text-center glass-surface-tier1 rounded-2xl border border-white/80 my-auto">
          <AlertTriangle className="w-10 h-10 text-[#E11D48] mx-auto mb-3 stroke-[1.75px]" />
          <p className="font-semibold text-[1rem] leading-[1.5rem] text-[#2C1E26] dark:text-[#FFFFFF]">{vi.errors.networkError}</p>
          <p data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] mt-1">{(error as any)?.message || vi.errors.networkError}</p>
          <div className="mt-5 flex justify-center">
            <GlassButton variant="primary" size="md" onClick={() => window.location.reload()}>
              {vi.common.retry}
            </GlassButton>
          </div>
        </div>
      </StandardPage>
    );
  }

  const { kpis, spendingByCard, monthlyTrends, cardStatuses } = data;

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-surface-tier1 p-3 text-[0.75rem] leading-[1rem] shadow-xl border border-white/80 dark:border-white/10 rounded-xl">
          <p className="font-semibold text-[#2C1E26] dark:text-[#FFFFFF] mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="font-medium flex items-center justify-between gap-3 tabular-nums">
              <span>{entry.name}:</span>
              <span>{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Attention cards filter
  const attentionCards = cardStatuses.filter(
    (c) =>
      c.paymentStatus === 'Quá hạn' ||
      c.paymentStatus === 'Đến hạn' ||
      c.paymentStatus === 'Sắp đến hạn' ||
      c.utilization >= 0.7 ||
      (c.cardCap && c.monthActualCashback / c.cardCap >= 0.8)
  ).slice(0, 6);

  const utilizationRatePct = (kpis.averageUtilization * 100).toFixed(1);
  const cashbackEffRatePct = kpis.monthTotalSpending > 0 
    ? ((kpis.monthActualCashback / kpis.monthTotalSpending) * 100).toFixed(2)
    : '0.00';

  return (
    <>
      <StandardPage
        title={vi.dashboard.title}
        layoutTemplate="stats-two-blocks"
        monthPicker={
          <GlassMonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            isLoading={isFetching}
          />
        }
        toolbar={
          <div className="text-[0.8125rem] leading-[1.125rem] text-[#68515E] dark:text-[#D8C9D2] font-normal truncate flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span>Tổng quan tài chính thẻ tín dụng & kết quả tối ưu hoàn tiền {formatMonthLabel(selectedMonth)}</span>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] px-4 font-normal">
            <span data-role="caption">Tổng hạn mức: <strong className="text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums font-medium">{formatCurrency(kpis.totalCreditLimit)}</strong></span>
            <span data-role="caption">Hiệu quả hoàn tiền tháng: <strong className="text-[#E27AA1] tabular-nums font-medium">{cashbackEffRatePct}%</strong></span>
          </div>
        }
      >
        {isTouch ? (
          /* MOBILE & TABLET TAILORED FINTECH DASHBOARD */
          <div className="space-y-4 pb-6">
            {/* 1. HERO OVERVIEW FINTECH WALLET CARD */}
            <div className="p-5 sm:p-6 rounded-[24px] bg-gradient-to-br from-[#E27AA1] via-[#DA6793] to-[#C7507F] text-white shadow-md shadow-[#E27AA1]/25 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.8125rem] leading-[1.125rem] font-medium text-white/90 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-white" />
                  Tổng dư nợ đã dùng
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white font-medium text-[0.75rem] leading-[1rem] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  +{formatCompactCurrency(kpis.monthActualCashback)}
                </span>
              </div>

              <div className="my-3">
                <div className="text-[1.875rem] sm:text-[2.125rem] leading-none font-semibold text-white tracking-tight tabular-nums">
                  <CountUp value={kpis.totalUsedCredit} currency decimals={0} />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-white/15">
                <div className="flex items-center justify-between text-[0.75rem] leading-[1rem] text-white/90">
                  <span>
                    Đã dùng <strong className="font-semibold text-white">{utilizationRatePct}%</strong>
                  </span>
                  <span>Khả dụng: <strong className="font-semibold text-white">{formatCompactCurrency(kpis.totalAvailableCredit)}</strong></span>
                </div>
                {/* Clean inline progress bar */}
                <div className="w-full h-2 rounded-full bg-black/15 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, Number(utilizationRatePct)))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[0.75rem] leading-[1rem] text-white/80 pt-0.5">
                  <span>Tổng hạn mức: {formatCompactCurrency(kpis.totalCreditLimit)}</span>
                  <span className="font-medium text-white">Chi tiêu tháng: {formatCompactCurrency(kpis.monthTotalSpending)}</span>
                </div>
              </div>
            </div>

            {/* 2. QUICK ACTION BUTTONS */}
            <div className="grid grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-2xs hover:border-[#E27AA1]/50 active:scale-95 transition-all text-center touch-target cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-pink-500/10 text-[#E27AA1] flex items-center justify-center shadow-2xs">
                  <Plus className="w-5 h-5 stroke-[2.2px]" />
                </div>
                <span className="text-[0.75rem] leading-[1rem] font-medium text-[#111827] dark:text-[#FFFFFF] truncate max-w-full">
                  Giao dịch
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/cards')}
                className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-2xs hover:border-[#E27AA1]/50 active:scale-95 transition-all text-center touch-target cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                  <CreditCard className="w-5 h-5 stroke-[1.75px]" />
                </div>
                <span className="text-[0.75rem] leading-[1rem] font-medium text-[#111827] dark:text-[#FFFFFF] truncate max-w-full">
                  Thẻ tín dụng
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/card-tracking')}
                className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-2xs hover:border-[#E27AA1]/50 active:scale-95 transition-all text-center touch-target cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                  <ShieldCheck className="w-5 h-5 stroke-[1.75px]" />
                </div>
                <span className="text-[0.75rem] leading-[1rem] font-medium text-[#111827] dark:text-[#FFFFFF] truncate max-w-full">
                  Sao kê & Hạn
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/cashback-rules')}
                className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-2xs hover:border-[#E27AA1]/50 active:scale-95 transition-all text-center touch-target cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-5 h-5 stroke-[1.75px]" />
                </div>
                <span className="text-[0.75rem] leading-[1rem] font-medium text-[#111827] dark:text-[#FFFFFF] truncate max-w-full">
                  Hoàn tiền
                </span>
              </button>
            </div>

            {/* 3. ATTENTION SECTION (Cần chú ý) */}
            {attentionCards.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[0.875rem] leading-[1.375rem] font-semibold text-[#111827] dark:text-[#FFFFFF] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Cần chú ý thanh toán ({attentionCards.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/card-tracking')}
                    className="text-[0.75rem] leading-[1rem] font-medium text-[#E27AA1] flex items-center cursor-pointer hover:underline"
                  >
                    Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {attentionCards.map((card) => {
                    const isDueSoon = card.paymentStatus === 'Sắp đến hạn' || card.paymentStatus === 'Đến hạn';
                    return (
                      <div
                        key={card.cardId}
                        onClick={() => setSelectedCardForDrawer(card)}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#181822] border border-amber-400/40 hover:border-amber-500 transition-all flex items-center justify-between gap-3 active:scale-[0.98] cursor-pointer shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[0.875rem] leading-[1.25rem] text-[#111827] dark:text-[#FFFFFF] truncate">
                              {card.bank} - {card.cardName}
                            </span>
                            {isDueSoon && (
                              <GlassBadge variant="warning" size="sm">
                                Còn {card.daysRemaining} ngày
                              </GlassBadge>
                            )}
                          </div>
                          <div className="text-[0.75rem] leading-[1rem] text-[#6B7280] dark:text-[#9CA3AF] mt-1 flex items-center gap-3">
                            <span>Dư nợ: <strong className="text-[#111827] dark:text-[#FFFFFF] tabular-nums font-medium">{formatCurrency(card.usedCredit)}</strong></span>
                            <span>Hạn: {formatDate(card.paymentDueDate)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/card-tracking?cardId=${encodeURIComponent(card.cardId)}`);
                          }}
                          className="px-3 py-1.5 rounded-full bg-pink-500/10 text-[#E27AA1] font-medium text-[0.75rem] leading-[1rem] shrink-0 hover:bg-pink-500/20 active:scale-95 cursor-pointer"
                        >
                          Chi tiết
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. MY CARDS WALLET DECK */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[0.875rem] leading-[1.375rem] font-semibold text-[#111827] dark:text-[#FFFFFF] flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#E27AA1]" />
                  Thẻ tín dụng ({cardStatuses.length})
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/cards')}
                  className="text-[0.75rem] leading-[1rem] font-medium text-[#E27AA1] flex items-center cursor-pointer hover:underline"
                >
                  Quản lý <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {cardStatuses.map((card) => {
                  const utilPct = Math.round(card.utilization * 100);
                  return (
                    <div
                      key={card.cardId}
                      onClick={() => setSelectedCardForDrawer(card)}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-2xs hover:border-[#E27AA1]/40 transition-all space-y-2.5 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-pink-500/10 text-[#E27AA1] flex items-center justify-center shrink-0">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[0.875rem] leading-[1.25rem] text-[#111827] dark:text-[#FFFFFF] truncate">
                              {card.bank} - {card.cardName}
                            </div>
                            <div className="text-[0.75rem] leading-[1rem] text-[#6B7280] dark:text-[#9CA3AF]">
                              Sao kê ngày {formatDate(card.latestStatementDate)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-[0.875rem] leading-[1.25rem] text-[#111827] dark:text-[#FFFFFF] tabular-nums">
                            {formatCompactCurrency(card.usedCredit)}
                          </div>
                          <div className="text-[0.75rem] leading-[1rem] text-[#6B7280] dark:text-[#9CA3AF] tabular-nums">
                            / {formatCompactCurrency(card.creditLimit)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <GlassProgress
                          value={utilPct}
                          max={100}
                          variant={card.utilization >= 0.8 ? 'danger' : card.utilization >= 0.6 ? 'warning' : 'pink'}
                        />
                        <div className="flex items-center justify-between text-[0.75rem] leading-[1rem] text-[#6B7280] dark:text-[#9CA3AF]">
                          <span>Dùng {utilPct}%</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Hoàn tháng: +{formatCompactCurrency(card.monthActualCashback)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. SPENDING BY CARD SUMMARY */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[0.875rem] leading-[1.375rem] font-semibold text-[#111827] dark:text-[#FFFFFF] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#E27AA1]" />
                  Phân bổ chi tiêu {formatMonthLabel(selectedMonth)}
                </h3>
                <span className="text-[0.75rem] leading-[1rem] font-semibold text-[#E27AA1] tabular-nums">
                  {formatCurrency(kpis.monthTotalSpending)}
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {spendingByCard.slice(0, 5).map((item, idx) => {
                  const spendPct = kpis.monthTotalSpending > 0 ? Math.round((item.spending / kpis.monthTotalSpending) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[0.8125rem] leading-[1.125rem]">
                        <span className="font-medium text-[#111827] dark:text-[#FFFFFF] truncate">{item.cardName}</span>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="font-medium text-[#111827] dark:text-[#FFFFFF]">{formatCurrency(item.spending)}</span>
                          <span className="text-[0.75rem] leading-[1rem] text-[#6B7280] dark:text-[#9CA3AF]">({spendPct}%)</span>
                        </div>
                      </div>
                      <GlassProgress value={spendPct} max={100} variant="pink" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* DESKTOP VIEW */
          <>
            {/* ROW 1: 4 STAT CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--block-gap,16px)] shrink-0">
              <StatCard
                label={vi.dashboard.usedCredit}
                value={kpis.totalUsedCredit}
                isCurrency={true}
                subtext={`Khả dụng: ${formatCompactCurrency(kpis.totalAvailableCredit)}`}
                icon={<Wallet className="w-4 h-4 stroke-[1.75px]" />}
              />
              <StatCard
                label={vi.dashboard.monthSpending}
                value={kpis.monthTotalSpending}
                isCurrency={true}
                subtext={`Tổng ${kpis.totalCards || 11} thẻ tín dụng`}
                icon={<TrendingUp className="w-4 h-4 stroke-[1.75px]" />}
              />
              <StatCard
                label={vi.dashboard.actualCashback}
                value={kpis.monthActualCashback}
                isCurrency={true}
                subtext={`Dự kiến: ${formatCompactCurrency(kpis.monthTheoreticalCashback)}`}
                icon={<Sparkles className="w-4 h-4 stroke-[1.75px] text-[#E27AA1]" />}
              />
              <StatCard
                label={vi.dashboard.averageUtilization}
                value={`${utilizationRatePct}%`}
                subtext={kpis.averageUtilization > 0.7 ? 'Cần theo dõi' : 'Mức an toàn'}
                icon={<Percent className="w-4 h-4 stroke-[1.75px]" />}
              />
            </div>

            {/* ROW 2: 2 BALANCED 6-COL BLOCKS SHARING REMAINING HEIGHT */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-[var(--block-gap,16px)]">
              {/* LEFT BLOCK: Spending by card | Monthly trends charts */}
              <GlassBlock
                title={leftTab === 'spendingByCard' ? vi.dashboard.chartSpendingByCardTitle : vi.dashboard.chartCashbackTrendsTitle}
                tabs={[
                  { id: 'spendingByCard', label: 'Chi tiêu theo thẻ' },
                  { id: 'monthlyTrends', label: 'Xu hướng theo tháng' },
                ]}
                activeTab={leftTab}
                onTabChange={(id) => setLeftTab(id as any)}
                bodyClassName="p-3 sm:p-4 flex flex-col justify-center"
              >
                {leftTab === 'spendingByCard' ? (
                  <div className="w-full h-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={spendingByCard}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                          dataKey="cardName"
                          tick={{ fontSize: 12, fill: '#68515E' }}
                          interval={0}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                          tickFormatter={(val) => (val.length > 9 ? `${val.substring(0, 8)}…` : val)}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#68515E' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => formatCompactCurrency(val)}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }} />
                        <Bar
                          dataKey="spending"
                          name={vi.dashboard.spendingLegend}
                          fill="#E27AA1"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          dataKey="cashback"
                          name={vi.dashboard.actualCashbackLegend}
                          fill="#059669"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyTrends}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: '#68515E' }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#68515E' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => formatCompactCurrency(val)}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }} />
                        <Bar
                          dataKey="spending"
                          name={vi.dashboard.spendingLegend}
                          fill="#3B82F6"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={28}
                        />
                        <Bar
                          dataKey="actualCashback"
                          name={vi.dashboard.actualCashbackLegend}
                          fill="#059669"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassBlock>

              {/* RIGHT BLOCK: Attention list | My cards list */}
              <GlassBlock
                title={rightTab === 'attention' ? vi.dashboard.attentionTitle : vi.dashboard.myCardsTitle}
                tabs={[
                  { id: 'attention', label: vi.dashboard.attentionTitle, count: attentionCards.length },
                  { id: 'myCards', label: vi.dashboard.myCardsTitle, count: cardStatuses.length },
                ]}
                activeTab={rightTab}
                onTabChange={(id) => setRightTab(id as any)}
                bodyClassName="p-3 sm:p-4 space-y-2.5"
              >
                {rightTab === 'attention' ? (
                  attentionCards.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 stroke-[1.75px]" />
                      </div>
                      <p data-role="caption" className="text-[0.8125rem] leading-[1.125rem] font-medium text-[#2C1E26] dark:text-[#FFFFFF]">
                        {vi.dashboard.attentionEmpty}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attentionCards.map((card) => {
                        const isDueSoon = card.paymentStatus === 'Sắp đến hạn' || card.paymentStatus === 'Đến hạn';
                        const isHighUtil = card.utilization >= 0.7;

                        return (
                          <div
                            key={card.cardId}
                            data-testid={`dashboard-attention-card-${card.cardId}`}
                            onClick={() => setSelectedCardForDrawer(card)}
                            className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:border-[#E27AA1]/40 transition-all flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[0.8125rem] leading-[1.125rem] text-[#2C1E26] dark:text-[#FFFFFF] truncate">
                                  {card.bank} - {card.cardName}
                                </span>
                                {isDueSoon && (
                                  <GlassBadge variant="warning" size="sm">
                                    Còn {card.daysRemaining} ngày
                                  </GlassBadge>
                                )}
                                {isHighUtil && (
                                  <GlassBadge variant="danger" size="sm">
                                    Dùng {(card.utilization * 100).toFixed(0)}%
                                  </GlassBadge>
                                )}
                              </div>
                              <div className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] mt-1 flex items-center gap-3">
                                <span data-role="caption">Dư nợ: <strong className="text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums font-medium">{formatCurrency(card.usedCredit)}</strong></span>
                                <span data-role="caption">Hạn TT: {formatDate(card.paymentDueDate)}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              title="Xem theo dõi thẻ"
                              aria-label={`Theo dõi thẻ ${card.cardName}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/card-tracking?cardId=${encodeURIComponent(card.cardId)}`);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#68515E] hover:text-[#E27AA1] transition-colors shrink-0 cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4 stroke-[1.75px]" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    {cardStatuses.map((card) => (
                      <div
                        key={card.cardId}
                        data-testid={`dashboard-mycard-${card.cardId}`}
                        onClick={() => setSelectedCardForDrawer(card)}
                        className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:border-[#E27AA1]/40 transition-all flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[0.8125rem] leading-[1.125rem] text-[#2C1E26] dark:text-[#FFFFFF] truncate">
                              {card.bank} - {card.cardName}
                            </span>
                            <span className="text-[0.8125rem] leading-[1.125rem] font-medium text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums shrink-0">
                              {formatCompactCurrency(card.creditLimit)}
                            </span>
                          </div>
                          <div className="mt-1.5">
                            <GlassProgress
                              value={card.utilization * 100}
                              variant={card.utilization >= 0.8 ? 'danger' : card.utilization >= 0.6 ? 'warning' : 'pink'}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          title="Xem theo dõi thẻ"
                          aria-label={`Theo dõi thẻ ${card.cardName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/card-tracking?cardId=${encodeURIComponent(card.cardId)}`);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#68515E] hover:text-[#E27AA1] transition-colors shrink-0 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 stroke-[1.75px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </GlassBlock>
            </div>
          </>
        )}
      </StandardPage>

      {/* Card Detail Slide-over Drawer */}
      <DetailDrawer
        isOpen={!!selectedCardForDrawer}
        onClose={() => setSelectedCardForDrawer(null)}
        title={selectedCardForDrawer?.cardName || 'Chi tiết thẻ'}
        subtitle={selectedCardForDrawer?.bank}
        width="560px"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <GlassButton
              variant="secondary"
              size="md"
              onClick={() => setSelectedCardForDrawer(null)}
            >
              {vi.common.close}
            </GlassButton>
            <GlassButton
              variant="primary"
              size="md"
              onClick={() => {
                const id = selectedCardForDrawer?.cardId;
                setSelectedCardForDrawer(null);
                if (id) {
                  navigate(`/card-tracking?cardId=${encodeURIComponent(id)}`);
                } else {
                  navigate('/card-tracking');
                }
              }}
            >
              Xem theo dõi thẻ
            </GlassButton>
          </div>
        }
      >
        {selectedCardForDrawer && (
          <div className="space-y-4 text-[0.8125rem] leading-[1.125rem]">
            <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[#68515E] dark:text-[#D8C9D2]">
                <span>Hạn mức tín dụng:</span>
                <span className="font-medium text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums">{formatCurrency(selectedCardForDrawer.creditLimit)}</span>
              </div>
              <div className="flex items-center justify-between text-[#68515E] dark:text-[#D8C9D2]">
                <span>Dư nợ hiện tại:</span>
                <span className="font-medium text-[#E27AA1] tabular-nums">{formatCurrency(selectedCardForDrawer.usedCredit)}</span>
              </div>
              <div className="flex items-center justify-between text-[#68515E] dark:text-[#D8C9D2]">
                <span>Hạn mức còn lại:</span>
                <span className="font-medium text-emerald-600 tabular-nums">{formatCurrency(selectedCardForDrawer.creditLimit - selectedCardForDrawer.usedCredit)}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[#68515E] dark:text-[#D8C9D2]">
                <span>Ngày sao kê định kỳ:</span>
                <span className="font-medium text-[#2C1E26] dark:text-[#FFFFFF]">{formatDate(selectedCardForDrawer.latestStatementDate)}</span>
              </div>
              <div className="flex items-center justify-between text-[#68515E] dark:text-[#D8C9D2]">
                <span>Hạn thanh toán:</span>
                <span className="font-medium text-[#2C1E26] dark:text-[#FFFFFF]">{formatDate(selectedCardForDrawer.paymentDueDate)}</span>
              </div>
              <div className="flex items-center justify-between text-[#68515E] dark:text-[#D8C9D2]">
                <span>Trạng thái thanh toán:</span>
                <GlassBadge variant={selectedCardForDrawer.paymentStatus === 'Đã thanh toán' ? 'success' : 'warning'}>
                  {selectedCardForDrawer.paymentStatus}
                </GlassBadge>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
};
