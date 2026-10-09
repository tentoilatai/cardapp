import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { 
  TrendingUp, Sparkles, CreditCard, 
  Receipt, CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, Pie, Cell, Tooltip 
} from 'recharts';
import { api } from '../lib/api';
import type { MonthViewData, Transaction } from '../types';
import { vi, mapCashbackStatus } from '../i18n/vi';
import { 
  formatCurrency, formatDate, 
  getMonthKeyNow, formatMonthLabel 
} from '../lib/formatters';
import { StandardPage } from '../components/layout/StandardPage';
import { StatCard } from '../components/layout/StatCard';
import { GlassBlock } from '../components/layout/GlassBlock';
import { DataTable, type DataTableColumn } from '../components/layout/DataTable';
import { GlassProgress } from '../components/glass/GlassProgress';
import { GlassBadge } from '../components/glass/GlassBadge';
import { GlassMonthPicker } from '../components/glass/GlassMonthPicker';
import { GlassSpinner } from '../components/glass/GlassSpinner';

import { useBreakpoint } from '../hooks/useBreakpoint';
import { CountUp } from '../components/glass/CountUp';

const PASTEL_COLORS = ['#E27AA1', '#9C88FF', '#48DBFB', '#1DD1A1', '#FF9FF3', '#FECA57', '#54A0FF', '#B53471'];

export const MonthPage: React.FC = () => {
  const { monthKey: rawMonthKey } = useParams<{ monthKey?: string }>();
  const navigate = useNavigate();
  const { isTouch } = useBreakpoint();

  const currentMonthKey = rawMonthKey 
    ? parseInt(rawMonthKey.replace('-', ''), 10) 
    : getMonthKeyNow();

  const [rightTab, setRightTab] = useState<'capProgress' | 'analysis'>('capProgress');

  const { data: monthData, isLoading, isFetching } = useQuery<MonthViewData>({
    queryKey: ['month-view', currentMonthKey],
    queryFn: () => api.get<MonthViewData>(`/api/months/${currentMonthKey}`),
    placeholderData: keepPreviousData,
  });

  const handleSelectMonth = (key: number) => {
    navigate(`/monthly-view/${key}`);
  };

  if (isLoading && !monthData) {
    return (
      <StandardPage
        title={vi.month.title}
        layoutTemplate="stats-two-blocks"
        monthPicker={
          <GlassMonthPicker
            value={currentMonthKey}
            onChange={handleSelectMonth}
            isLoading={true}
          />
        }
      >
        <div className="w-full h-full flex flex-col items-center justify-center min-h-[320px]">
          <GlassSpinner size="lg" label="Đang tải dữ liệu báo cáo tháng..." />
        </div>
      </StandardPage>
    );
  }

  const summary = monthData?.summary || {
    totalSpending: 0,
    totalActualCashback: 0,
    totalTheoreticalCashback: 0,
    transactionCount: 0,
    totalCardsUsed: 0,
  };

  const transactions = monthData?.transactions || [];
  const groupCapProgressList = monthData?.groupCapProgressList || [];
  const breakdownByCategory = monthData?.breakdownByCategory || [];

  const effRate = summary.totalSpending > 0 
    ? ((summary.totalActualCashback / summary.totalSpending) * 100).toFixed(2)
    : '0.00';

  // Columns for left table
  const columns: DataTableColumn<Transaction>[] = [
    {
      id: 'date',
      header: 'Ngày',
      width: '90px',
      priority: 1,
      mobile: 'subtitle',
      render: (t) => (
        <span className="tabular-nums font-mono text-xs text-[#68515E] dark:text-[#D8C9D2]">
          {formatDate(t.date)}
        </span>
      )
    },
    {
      id: 'merchant',
      header: 'Đơn vị chi tiêu',
      width: '180px',
      priority: 1,
      sticky: true,
      mobile: 'title',
      render: (t) => (
        <div className="truncate">
          <div className="font-semibold text-sm text-[#2C1E26] dark:text-[#FFFFFF] truncate">{t.merchant}</div>
          <div className="text-xs text-[#68515E] dark:text-[#D8C9D2] truncate">{t.cardId}</div>
        </div>
      )
    },
    {
      id: 'amount',
      header: 'Số tiền',
      width: '120px',
      align: 'right',
      priority: 1,
      mobile: 'value',
      render: (t) => (
        <span className="font-semibold tabular-nums text-sm text-[#2C1E26] dark:text-[#FFFFFF]">
          {formatCurrency(t.amount)}
        </span>
      )
    },
    {
      id: 'actualCashback',
      header: 'Hoàn tiền',
      width: '120px',
      align: 'right',
      priority: 1,
      mobile: 'meta',
      metaLabel: 'Hoàn tiền',
      render: (t) => (
        <span className="font-semibold tabular-nums text-sm text-emerald-600 dark:text-emerald-400">
          +{formatCurrency(t.actualCashback)}
        </span>
      )
    },
    {
      id: 'cashbackStatus',
      header: 'Trạng thái',
      width: '110px',
      align: 'center',
      priority: 2,
      mobile: 'badge',
      render: (t) => (
        <GlassBadge variant={t.actualCashback > 0 ? 'success' : 'neutral'} size="sm">
          {mapCashbackStatus(t.cashbackStatus)}
        </GlassBadge>
      )
    }
  ];

  return (
    <StandardPage
      title={`${vi.month.title} ${formatMonthLabel(currentMonthKey)}`}
      layoutTemplate="stats-two-blocks"
      monthPicker={
        <GlassMonthPicker
          value={currentMonthKey}
          onChange={handleSelectMonth}
          isLoading={isFetching}
        />
      }
      toolbar={
        <div className="text-xs text-[#68515E] dark:text-[#D8C9D2] font-medium truncate flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E27AA1] shrink-0" />
          <span>Báo cáo phân bổ chi tiêu, tiến độ hoàn tiền và hiệu suất các thẻ {formatMonthLabel(currentMonthKey)}</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full text-xs text-[#68515E] dark:text-[#D8C9D2] px-4 font-medium">
          <span>Tổng số giao dịch: <strong className="text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums">{summary.transactionCount}</strong></span>
          <span>Tỷ lệ hoàn tiền: <strong className="text-[#E27AA1] tabular-nums font-semibold">{effRate}%</strong></span>
        </div>
      }
    >
      {isTouch ? (
        /* MOBILE VIEW FOR MONTH PAGE */
        <div className="space-y-4 pb-6">
          {/* Hero Monthly Summary Card */}
          <div className="p-5 rounded-[24px] bg-gradient-to-br from-[#E27AA1] via-[#DA6793] to-[#C7507F] text-white shadow-md shadow-[#E27AA1]/25 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.8125rem] leading-[1.125rem] font-medium text-white/90">
                Tổng chi tiêu {formatMonthLabel(currentMonthKey)}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white font-medium text-[0.75rem] leading-[1rem]">
                +{formatCurrency(summary.totalActualCashback)} hoàn tiền
              </span>
            </div>

            <div className="my-3">
              <div className="text-[1.875rem] leading-none font-semibold text-white tracking-tight tabular-nums">
                <CountUp value={summary.totalSpending} currency decimals={0} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 text-xs text-white/90">
              <div>
                <span>Giao dịch:</span>{' '}
                <strong className="text-white font-medium">{summary.transactionCount} GD</strong>
              </div>
              <div className="text-right">
                <span>Hiệu suất:</span>{' '}
                <strong className="text-white font-semibold">{effRate}%</strong>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="rounded-2xl bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] overflow-hidden shadow-xs">
            <div className="p-3 px-4 border-b border-[#F0F1F4] dark:border-[#262634] font-semibold text-sm text-[#111827] dark:text-[#FFFFFF]">
              Giao dịch phát sinh ({transactions.length})
            </div>
            <DataTable<Transaction>
              columns={columns}
              data={transactions}
              keyExtractor={(t) => t.id}
              emptyTitle="Chưa có giao dịch"
              emptyDescription="Tháng này chưa phát sinh giao dịch chi tiêu thẻ nào."
            />
          </div>

          {/* Cashback Cap Progress */}
          {groupCapProgressList.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#E8EAEF] dark:border-[#262634] shadow-xs space-y-3">
              <div className="font-semibold text-sm text-[#2C1E26] dark:text-[#FFFFFF]">
                Tiến độ hoàn tiền theo nhóm
              </div>
              <div className="space-y-3">
                {groupCapProgressList.map((item, idx) => {
                  const pct = item.progressPercentage || (item.groupCap && item.groupCap > 0
                    ? Math.min(100, (item.actualCashback / item.groupCap) * 100)
                    : 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#2C1E26] dark:text-[#FFFFFF] truncate">
                          {item.cardName} • {item.groupName}
                        </span>
                        <span className="font-mono text-emerald-600 font-semibold tabular-nums">
                          {formatCurrency(item.actualCashback)} {item.groupCap ? `/ ${formatCurrency(item.groupCap)}` : ''}
                        </span>
                      </div>
                      <GlassProgress value={pct} max={100} variant={pct >= 80 ? 'danger' : 'pink'} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DESKTOP VIEW */
        <>
          {/* ROW 1: 4 STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--block-gap,16px)] shrink-0">
            <StatCard
              label={vi.month.totalSpending}
              value={summary.totalSpending}
              isCurrency={true}
              subtext={`${summary.transactionCount} giao dịch phát sinh`}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              label={vi.month.actualCashback}
              value={summary.totalActualCashback}
              isCurrency={true}
              subtext={`Dự kiến: ${formatCurrency(summary.totalTheoreticalCashback)}`}
              icon={<Sparkles className="w-4 h-4 text-[#E27AA1]" />}
            />
            <StatCard
              label="Thẻ đã phát sinh chi tiêu"
              value={`${new Set(transactions.map((t) => t.cardId)).size} thẻ`}
              subtext="Số thẻ hoạt động trong tháng"
              icon={<CreditCard className="w-4 h-4" />}
            />
            <StatCard
              label="Tỷ lệ hoàn tiền thực nhận"
              value={`${effRate}%`}
              subtext="Hiệu suất hoàn tiền tổng thể"
              icon={<Receipt className="w-4 h-4 text-emerald-600" />}
            />
          </div>

          {/* ROW 2: 2 BALANCED 6-COL BLOCKS */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-[var(--block-gap,16px)]">
            {/* LEFT BLOCK: Transactions Table */}
            <GlassBlock
              title={`Giao dịch trong tháng (${transactions.length})`}
              bodyClassName="p-0"
            >
              <DataTable<Transaction>
                columns={columns}
                data={transactions}
                keyExtractor={(t) => t.id}
                emptyTitle="Chưa có giao dịch"
                emptyDescription="Tháng này chưa phát sinh giao dịch chi tiêu thẻ nào."
              />
            </GlassBlock>

            {/* RIGHT BLOCK: Cashback Progress & Category Analysis */}
            <GlassBlock
              title={rightTab === 'capProgress' ? 'Tiến độ hoàn tiền các thẻ' : 'Phân tích danh mục chi tiêu'}
              tabs={[
                { id: 'capProgress', label: 'Tiến độ hoàn tiền' },
                { id: 'analysis', label: 'Phân tích danh mục' }
              ]}
              activeTab={rightTab}
              onTabChange={(id) => setRightTab(id as any)}
              bodyClassName="p-4 space-y-3"
            >
              {rightTab === 'capProgress' ? (
                groupCapProgressList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <p className="text-xs text-[#826B76]">Chưa có dữ liệu tiến độ hoàn tiền trong tháng này.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupCapProgressList.map((item, idx) => {
                      const pct = item.progressPercentage || (item.groupCap && item.groupCap > 0
                        ? Math.min(100, (item.actualCashback / item.groupCap) * 100)
                        : 100);
                      const isNearCap = pct >= 80;

                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-[12px] glass-surface-tier2 border border-[#E5E7EB] dark:border-[#262634] space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-sm text-[#2C1E26] dark:text-[#FFFFFF] truncate">
                              {item.cardName} • {item.groupName}
                            </span>
                            <span className="font-mono text-emerald-600 font-semibold tabular-nums text-sm">
                              {formatCurrency(item.actualCashback)} {item.groupCap ? `/ ${formatCurrency(item.groupCap)}` : ''}
                            </span>
                          </div>
                          <GlassProgress
                            value={pct}
                            variant={isNearCap ? 'danger' : 'pink'}
                          />
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center min-h-[220px]">
                  {breakdownByCategory.length === 0 ? (
                    <p className="text-xs text-[#826B76]">Không có dữ liệu phân loại chi tiêu.</p>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={180}>
                        <RechartsPieChart>
                          <Pie
                            data={breakdownByCategory}
                            dataKey="spending"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={65}
                            innerRadius={35}
                            paddingAngle={3}
                          >
                            {breakdownByCategory.map((_, i) => (
                              <Cell key={i} fill={PASTEL_COLORS[i % PASTEL_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-2 pt-2 text-xs">
                        {breakdownByCategory.slice(0, 5).map((item, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: PASTEL_COLORS[i % PASTEL_COLORS.length] }}
                            />
                            <span className="font-medium text-xs text-[#2C1E26] dark:text-[#FFFFFF] truncate max-w-[100px]">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassBlock>
          </div>
        </>
      )}
    </StandardPage>
  );
};
