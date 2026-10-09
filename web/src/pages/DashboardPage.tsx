import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Percent
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
import { StandardPage } from '../components/layout/StandardPage';
import { StatCard } from '../components/layout/StatCard';
import { GlassBlock } from '../components/layout/GlassBlock';
import { GlassBadge } from '../components/glass/GlassBadge';
import { GlassProgress } from '../components/glass/GlassProgress';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassMonthPicker } from '../components/glass/GlassMonthPicker';
import { GlassSpinner } from '../components/glass/GlassSpinner';
import { DetailDrawer } from '../components/layout/DetailDrawer';

export const DashboardPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(getCurrentMonthKey());
  const [leftTab, setLeftTab] = useState<'spendingByCard' | 'monthlyTrends'>('spendingByCard');
  const [rightTab, setRightTab] = useState<'attention' | 'myCards'>('attention');
  const [selectedCardForDrawer, setSelectedCardForDrawer] = useState<CardStatusSummary | null>(null);
  const navigate = useNavigate();

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
