import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { api } from '../lib/api';
import type { CardStatus, Card } from '../types';
import { vi, mapUtilizationLevel } from '../i18n/vi';
import { formatCurrency, formatDate } from '../lib/formatters';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';
import { GlassProgress } from '../components/glass/GlassProgress';
import { GlassSkeleton } from '../components/glass/CountUp';
import { StandardPage } from '../components/layout/StandardPage';
import { GlassBlock } from '../components/layout/GlassBlock';
import { StandardDialog } from '../components/layout/StandardDialog';
import { FormActions } from '../components/layout/FormActions';
import { EmptyState } from '../components/layout/EmptyState';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useToast } from '../components/glass/Toast';

export const TrackerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isMobile } = useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cardId: routeCardId } = useParams<{ cardId?: string }>();

  const queryCardId = searchParams.get('cardId') || searchParams.get('id');
  const targetCardId = routeCardId || queryCardId || null;

  const [selectedCardId, setSelectedCardId] = useState<string | null>(targetCardId);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>(targetCardId && isMobile ? 'detail' : 'list');
  const [confirmPaymentCard, setConfirmPaymentCard] = useState<CardStatus | null>(null);

  const selectedCardRef = useRef<HTMLDivElement>(null);

  // Queries
  const {
    data: cardStatuses = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<CardStatus[]>({
    queryKey: ['card-statuses'],
    queryFn: async () => {
      try {
        return await api.get<CardStatus[]>('/api/cards/statuses');
      } catch {
        const cards = await api.get<Card[]>('/api/cards');
        const statusPromises = cards.map(async (c) => {
          return api.get<CardStatus>(`/api/cards/${c.id}/status`);
        });
        return Promise.all(statusPromises);
      }
    },
  });

  // Sync selected card & view when targetCardId in URL changes
  useEffect(() => {
    if (targetCardId) {
      setSelectedCardId(targetCardId);
      if (isMobile) {
        setMobileView('detail');
      }
    }
  }, [targetCardId, isMobile]);

  // Active card: matched by ID (case-insensitive) or name, fallback to first
  const activeCard = useMemo(() => {
    if (!cardStatuses || cardStatuses.length === 0) return null;

    const idToFind = selectedCardId || targetCardId;
    if (idToFind) {
      const clean = idToFind.trim().toLowerCase();
      const matched = cardStatuses.find(
        (c) =>
          c.cardId.toLowerCase() === clean ||
          c.cardName.toLowerCase() === clean
      );
      if (matched) return matched;
    }

    return cardStatuses[0];
  }, [cardStatuses, selectedCardId, targetCardId]);

  // Sync selectedCardId to activeCard when data loads
  useEffect(() => {
    if (activeCard && !selectedCardId) {
      setSelectedCardId(activeCard.cardId);
    }
  }, [activeCard, selectedCardId]);

  // Auto-scroll selected card into view in the card list
  useEffect(() => {
    if (activeCard?.cardId && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeCard?.cardId]);

  // Mutation: Mark statement paid
  const markStatementPaidMutation = useMutation({
    mutationFn: (cardId: string) => api.post(`/api/cards/${cardId}/mark-statement-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setConfirmPaymentCard(null);
      showToast({ message: 'Đã đánh dấu sao kê đã thanh toán', variant: 'success' });
    },
    onError: (err: any) => {
      showToast({ message: err.message || 'Thao tác thanh toán thất bại', variant: 'error' });
    }
  });

  const getUtilizationProgressVariant = (
    level: string
  ): 'pink' | 'purple' | 'success' | 'warning' | 'danger' => {
    switch (level) {
      case 'Nguy hiểm':
        return 'danger';
      case 'Cảnh báo':
        return 'warning';
      case 'Cảnh báo nhẹ':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getPaymentStatusBadge = (status: string, daysRemaining: number) => {
    switch (status) {
      case 'Đã thanh toán':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            {status}
          </span>
        );
      case 'Quá hạn':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D64560] animate-pulse">
            <AlertCircle className="w-4 h-4" />
            Quá hạn {Math.abs(daysRemaining)} ngày
          </span>
        );
      case 'Đến hạn':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D64560]">
            <Clock className="w-4 h-4" />
            Hôm nay đến hạn
          </span>
        );
      case 'Sắp đến hạn':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <Clock className="w-4 h-4" />
            Còn {daysRemaining} ngày
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#826B76]">
            Còn {daysRemaining} ngày
          </span>
        );
    }
  };

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId(cardId);
    setSearchParams({ cardId }, { replace: true });
    if (isMobile) {
      setMobileView('detail');
    }
  };

  return (
    <StandardPage
      title={vi.tracker.title}
      description={vi.tracker.subtitle}
      layoutTemplate="two-equal-blocks"
      testId="tracker-page"
      primaryAction={
        <GlassButton
          variant="secondary"
          leftIcon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          {vi.tracker.refresh}
        </GlassButton>
      }
      footer={
        <div className="w-full flex items-center justify-between text-xs text-[#826B76]">
          <span>{vi.tracker.cardListTitle}: <strong className="text-[#3B2A33] font-mono">{cardStatuses.length}</strong></span>
          {activeCard && (
            <span>Thẻ đang xem: <strong className="text-[#3B2A33]">{activeCard.cardName}</strong></span>
          )}
        </div>
      }
    >
      {/* KHỐI 1: DANH SÁCH THẺ (6 cột desktop/tablet, ẩn khi xem detail trên mobile) */}
      {(!isMobile || mobileView === 'list') && (
        <div className="col-span-12 md:col-span-6 h-full min-h-0">
          <GlassBlock
            title={vi.tracker.cardListTitle}
            subtitle={`${cardStatuses.length} thẻ`}
            icon={<CreditCard className="w-4 h-4" />}
            testId="tracker-cards-list-block"
            bodyClassName="p-3 sm:p-4 space-y-3"
          >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <GlassSkeleton key={i} height={100} />
                ))}
              </div>
            ) : cardStatuses.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="w-8 h-8 text-[#E27AA1]" />}
                title={vi.tracker.noCardsFound}
                description={vi.tracker.noCardsPrompt}
              />
            ) : (
              cardStatuses.map((card) => {
                const isSelected = activeCard?.cardId?.toLowerCase() === card.cardId?.toLowerCase();
                const utilPercent = Math.round(card.utilization * 100);

                return (
                  <div
                    key={card.cardId}
                    ref={isSelected ? selectedCardRef : undefined}
                    tabIndex={0}
                    data-testid={`tracker-card-${card.cardId}`}
                    data-card-item="true"
                    onClick={() => handleSelectCard(card.cardId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectCard(card.cardId);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-[16px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/95 border-[#E27AA1]/60 shadow-md ring-2 ring-[#E27AA1]/30'
                        : 'glass-surface-tier2 hover:bg-white/80 border-white/40 dark:border-white/10 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#3B2A33] truncate">
                            {card.cardName}
                          </h4>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/5 text-[#826B76] shrink-0">
                            {card.cardId}
                          </span>
                        </div>
                        <p className="text-xs text-[#826B76] font-medium mt-0.5">
                          {card.bank}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <GlassBadge
                          variant={
                            card.utilizationLevel === 'Nguy hiểm'
                              ? 'danger'
                              : card.utilizationLevel === 'Cảnh báo' ||
                                card.utilizationLevel === 'Cảnh báo nhẹ'
                              ? 'warning'
                              : 'success'
                          }
                          size="sm"
                        >
                          {mapUtilizationLevel(card.utilizationLevel)}
                        </GlassBadge>
                        {isMobile && <ChevronRight className="w-4 h-4 text-[#826B76]" />}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-[#826B76]">
                        <span>Tỷ lệ dùng: <b className="text-[#3B2A33] font-mono">{utilPercent}%</b></span>
                        <span className="font-mono">{formatCurrency(card.usedCredit)} / {formatCurrency(card.creditLimit)}</span>
                      </div>
                      <GlassProgress
                        value={utilPercent}
                        max={100}
                        variant={getUtilizationProgressVariant(card.utilizationLevel)}
                      />
                    </div>

                    <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                      <span className="text-[#826B76]">
                        Hạn thanh toán: <strong className="text-[#3B2A33] font-mono">{formatDate(card.paymentDueDate)}</strong>
                      </span>
                      <div>{getPaymentStatusBadge(card.paymentStatus, card.daysRemaining)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </GlassBlock>
        </div>
      )}

      {/* KHỐI 2: CHI TIẾT THẺ ĐANG CHỌN (6 cột desktop/tablet, toàn màn hình có Back khi mobile) */}
      {(!isMobile || mobileView === 'detail') && (
        <div className="col-span-12 md:col-span-6 h-full min-h-0">
          <GlassBlock
            title={activeCard ? activeCard.cardName : vi.tracker.cardDetailTitle}
            subtitle={activeCard ? activeCard.bank : undefined}
            icon={<CreditCard className="w-4 h-4" />}
            testId="tracker-card-detail-block"
            actions={
              isMobile && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => setMobileView('list')}
                >
                  {vi.tracker.backToList}
                </GlassButton>
              )
            }
            bodyClassName="p-4 sm:p-5 h-full overflow-hidden"
          >
            {isLoading ? (
              <GlassSkeleton height={320} />
            ) : !activeCard ? (
              <EmptyState
                icon={<CreditCard className="w-8 h-8 text-[#E27AA1]" />}
                title={vi.tracker.cardDetailTitle}
                description={vi.tracker.selectCardPrompt}
              />
            ) : (
              <div className="h-full flex flex-col justify-between gap-3 sm:gap-4">
                {/* 1. Header & Payment Status Bar */}
                <div className="p-4 rounded-[16px] glass-surface-tier2 border border-white/40 dark:border-white/10 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#E27AA1]/15 text-[#E27AA1] font-semibold shrink-0">
                        {activeCard.cardId}
                      </span>
                      <span className="text-xs text-[#826B76] font-medium truncate">{activeCard.bank}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#3B2A33] dark:text-[#F6EDF2] truncate mt-1">
                      {activeCard.cardName}
                    </h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-xs text-[#826B76] mb-1">Trạng thái thanh toán</span>
                    <div>{getPaymentStatusBadge(activeCard.paymentStatus, activeCard.daysRemaining)}</div>
                  </div>
                </div>

                {/* 2. Utilization Metrics */}
                <div className="p-4 rounded-[16px] glass-surface-tier2 border border-white/40 dark:border-white/10 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#3B2A33] dark:text-[#F6EDF2] text-sm">
                      Tỷ lệ sử dụng hạn mức
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#E27AA1] text-sm">
                        {Math.round(activeCard.utilization * 100)}%
                      </span>
                      <GlassBadge
                        variant={
                          activeCard.utilizationLevel === 'Nguy hiểm'
                            ? 'danger'
                            : activeCard.utilizationLevel === 'Cảnh báo' ||
                              activeCard.utilizationLevel === 'Cảnh báo nhẹ'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {mapUtilizationLevel(activeCard.utilizationLevel)}
                      </GlassBadge>
                    </div>
                  </div>

                  <GlassProgress
                    value={Math.round(activeCard.utilization * 100)}
                    max={100}
                    variant={getUtilizationProgressVariant(activeCard.utilizationLevel)}
                  />

                  <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                    <div className="py-2.5 px-2 rounded-[12px] bg-black/5 dark:bg-white/5">
                      <span className="block text-xs text-[#826B76] mb-0.5">Hạn mức</span>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-[#3B2A33] dark:text-[#F6EDF2] block truncate">
                        {formatCurrency(activeCard.creditLimit)}
                      </span>
                    </div>
                    <div className="py-2.5 px-2 rounded-[12px] bg-black/5 dark:bg-white/5">
                      <span className="block text-xs text-[#826B76] mb-0.5">Đã dùng</span>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-[#D64560] block truncate">
                        {formatCurrency(activeCard.usedCredit)}
                      </span>
                    </div>
                    <div className="py-2.5 px-2 rounded-[12px] bg-black/5 dark:bg-white/5">
                      <span className="block text-xs text-[#826B76] mb-0.5">Còn lại</span>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
                        {formatCurrency(activeCard.availableCredit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Billing and Due Date Details (3-column balanced cards) */}
                <div className="p-4 rounded-[16px] glass-surface-tier2 border border-white/40 dark:border-white/10 space-y-2.5 text-xs shadow-2xs">
                  <h4 className="font-semibold text-[#3B2A33] dark:text-[#F6EDF2] flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-[#E27AA1]" />
                    Chu kỳ sao kê & Thanh toán
                  </h4>

                  <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                    <div className="py-2.5 px-2 rounded-[12px] bg-black/5 dark:bg-white/5">
                      <span className="block text-xs text-[#826B76] mb-0.5">Kỳ sao kê</span>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-[#3B2A33] dark:text-[#F6EDF2] block">
                        {formatDate(activeCard.latestStatementDate)}
                      </span>
                    </div>

                    <div className="py-2.5 px-2 rounded-[12px] bg-black/5 dark:bg-white/5">
                      <span className="block text-xs text-[#826B76] mb-0.5">Hạn trả</span>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-[#3B2A33] dark:text-[#F6EDF2] block">
                        {formatDate(activeCard.paymentDueDate)}
                      </span>
                    </div>

                    <div className="py-2.5 px-2 rounded-[12px] bg-[#D64560]/10 border border-[#D64560]/20">
                      <span className="block text-xs text-[#826B76] mb-0.5">Dư nợ sao kê</span>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-[#D64560] block truncate">
                        {formatCurrency(activeCard.unpaidStatementBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Action button pinned at bottom */}
                <div className="pt-1">
                  <GlassButton
                    variant="primary"
                    size="md"
                    className="w-full justify-center font-medium"
                    disabled={activeCard.unpaidStatementBalance === 0}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => setConfirmPaymentCard(activeCard)}
                  >
                    {vi.tracker.markStatementPaid}
                  </GlassButton>
                  {activeCard.unpaidStatementBalance === 0 && (
                    <p className="text-xs text-center text-emerald-600 font-medium mt-1.5">
                      Dư nợ kỳ sao kê này đã được thanh toán toàn bộ.
                    </p>
                  )}
                </div>
              </div>
            )}
          </GlassBlock>
        </div>
      )}

      {/* Confirmation Dialog */}
      <StandardDialog
        isOpen={Boolean(confirmPaymentCard)}
        onClose={() => setConfirmPaymentCard(null)}
        title={vi.tracker.confirmPaidTitle}
        testId="tracker-confirm-payment-dialog"
        footer={
          <FormActions
            onCancel={() => setConfirmPaymentCard(null)}
            cancelLabel={vi.common.cancel}
            onSave={() => {
              if (confirmPaymentCard) {
                markStatementPaidMutation.mutate(confirmPaymentCard.cardId);
              }
            }}
            saveLabel={vi.common.confirm}
            isSubmitting={markStatementPaidMutation.isPending}
          />
        }
      >
        {confirmPaymentCard && (
          <div className="space-y-3 text-xs">
            <p className="text-[#826B76]">
              Bạn muốn đánh dấu toàn bộ dư nợ sao kê của thẻ{' '}
              <strong className="text-[#3B2A33]">{confirmPaymentCard.cardName}</strong> là{' '}
              <strong className="text-emerald-600">Đã thanh toán</strong>?
            </p>

            <div className="p-3.5 rounded-[12px] bg-black/5 dark:bg-white/5 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-[#826B76]">Kỳ sao kê:</span>
                <span className="font-mono text-[#3B2A33] dark:text-[#F6EDF2]">{formatDate(confirmPaymentCard.latestStatementDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#826B76]">Số tiền thanh toán:</span>
                <span className="font-mono text-[#E27AA1] font-semibold">{formatCurrency(confirmPaymentCard.unpaidStatementBalance)}</span>
              </div>
            </div>

            <p className="text-xs text-[#826B76]">
              Thao tác này sẽ cập nhật các giao dịch trong kỳ thành "Đã thanh toán" và giải phóng hạn mức tín dụng đã dùng.
            </p>
          </div>
        )}
      </StandardDialog>
    </StandardPage>
  );
};

export default TrackerPage;
