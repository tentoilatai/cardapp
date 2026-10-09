import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Plus, Search, Trash2, Edit2, Filter, 
  Sparkles, RotateCcw
} from 'lucide-react';
import { api } from '../lib/api';
import type { 
  Transaction, Card, Mcc, 
  TransactionPreviewResponse, PagedResult 
} from '../types';
import { vi, mapCashbackStatus } from '../i18n/vi';
import { 
  formatCurrency, formatRate, formatDate, 
  getMonthKeyNow, formatMonthLabel 
} from '../lib/formatters';
import { StandardPage } from '../components/layout/StandardPage';
import { DataTable, type DataTableColumn } from '../components/layout/DataTable';
import { Pagination } from '../components/layout/Pagination';
import { DetailDrawer } from '../components/layout/DetailDrawer';
import { StandardDialog } from '../components/layout/StandardDialog';
import { BottomSheet } from '../components/layout/BottomSheet';
import { FormActions } from '../components/layout/FormActions';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassInput } from '../components/glass/GlassInput';
import { GlassCurrencyInput } from '../components/glass/GlassCurrencyInput';
import { GlassSelect } from '../components/glass/GlassSelect';
import { GlassBadge } from '../components/glass/GlassBadge';
import { GlassMonthPicker } from '../components/glass/GlassMonthPicker';
import { useToast } from '../components/glass/Toast';

export const TransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  // Filters state
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonthKeyNow());
  const [selectedCardId, setSelectedCardId] = useState<string>('ALL');
  const [selectedMcc, setSelectedMcc] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCashbackStatus, setSelectedCashbackStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer / Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Form state
  const [form, setForm] = useState({
    cardId: '',
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    description: '',
    mccCode: '5812',
    amount: 1000000,
    status: 'Posted',
    paymentStatus: 'Chưa thanh toán',
    overrideRuleId: '' as string,
    note: '',
  });

  // Preview state
  const [previewResult, setPreviewResult] = useState<TransactionPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Queries
  const { data: cards = [] } = useQuery<Card[]>({
    queryKey: ['cards'],
    queryFn: () => api.get<Card[]>('/api/cards')
  });

  const { data: mccList = [] } = useQuery<Mcc[]>({
    queryKey: ['mcc-all'],
    queryFn: () => api.get<Mcc[]>('/api/mcc')
  });

  // Transactions query
  const { data: pagedData, isLoading, isFetching } = useQuery<PagedResult<Transaction>>({
    queryKey: ['transactions', selectedMonth, selectedCardId, selectedMcc, selectedStatus, selectedCashbackStatus, searchTerm, currentPage, pageSize],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('monthKey', selectedMonth.toString());
      if (selectedCardId !== 'ALL') params.append('cardId', selectedCardId);
      if (selectedMcc !== 'ALL') params.append('mccCode', selectedMcc);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedCashbackStatus !== 'ALL') params.append('cashbackStatus', selectedCashbackStatus);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());

      return api.get<PagedResult<Transaction>>(`/api/transactions?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const transactions: Transaction[] = pagedData?.items || [];
  const totalCount: number = pagedData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Real-time Preview Effect when amount, cardId, date, or mcc changes in the form
  useEffect(() => {
    if (!isDrawerOpen || !form.cardId || form.amount <= 0) {
      setPreviewResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsPreviewLoading(true);
        const result = await api.post<TransactionPreviewResponse>('/api/transactions/preview', {
          cardId: form.cardId,
          date: form.date,
          mccCode: form.mccCode,
          amount: form.amount,
        });
        setPreviewResult(result);
      } catch {
        setPreviewResult(null);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [form.cardId, form.date, form.mccCode, form.amount, isDrawerOpen]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['card-statuses'] });
      setIsDrawerOpen(false);
      resetForm();
      toast.success('Đã thêm giao dịch mới thành công!');
    },
    onError: (err: any) => {
      alert(err.message || vi.errors.networkError);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['card-statuses'] });
      setIsDrawerOpen(false);
      resetForm();
      toast.success('Cập nhật giao dịch thành công!');
    },
    onError: (err: any) => {
      alert(err.message || vi.errors.networkError);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['card-statuses'] });
      setDeletingTransaction(null);
      toast.success('Đã xóa giao dịch thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xóa giao dịch thất bại');
    }
  });

  const resetForm = () => {
    setEditingTransaction(null);
    setForm({
      cardId: cards[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      description: '',
      mccCode: '5812',
      amount: 1000000,
      status: 'Posted',
      paymentStatus: 'Chưa thanh toán',
      overrideRuleId: '',
      note: '',
    });
    setPreviewResult(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setForm({
      cardId: tx.cardId,
      date: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
      merchant: tx.merchant,
      description: tx.description || '',
      mccCode: tx.mccCode,
      amount: tx.amount,
      status: tx.status,
      paymentStatus: tx.paymentStatus,
      overrideRuleId: tx.overrideRuleId || '',
      note: tx.note || '',
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.cardId) {
      alert('Vui lòng chọn thẻ tín dụng.');
      return;
    }
    if (!form.merchant.trim()) {
      alert('Vui lòng nhập tên điểm chấp nhận thẻ / Merchant.');
      return;
    }
    if (form.amount <= 0) {
      alert('Số tiền chi tiêu phải lớn hơn 0.');
      return;
    }

    const payload = {
      cardId: form.cardId,
      date: form.date,
      merchant: form.merchant.trim(),
      description: form.description?.trim() || null,
      mccCode: form.mccCode,
      amount: form.amount,
      status: form.status,
      paymentStatus: form.paymentStatus,
      overrideRuleId: form.overrideRuleId || null,
      note: form.note?.trim() || null,
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Active filter count
  const activeFilterCount = 
    (selectedCardId !== 'ALL' ? 1 : 0) +
    (selectedMcc !== 'ALL' ? 1 : 0) +
    (selectedCashbackStatus !== 'ALL' ? 1 : 0) +
    (selectedStatus !== 'ALL' ? 1 : 0);

  // DataTable columns (7 columns standard)
  const columns: DataTableColumn<Transaction>[] = [
    {
      id: 'date',
      header: 'Ngày giao dịch',
      width: '110px',
      priority: 1,
      mobile: 'subtitle',
      render: (t) => (
        <span className="tabular-nums font-mono text-[0.8125rem] leading-[1.125rem] text-[#68515E] dark:text-[#D8C9D2]">
          {formatDate(t.date)}
        </span>
      )
    },
    {
      id: 'cardId',
      header: 'Thẻ tín dụng',
      width: '160px',
      priority: 1,
      sticky: true,
      mobile: 'meta',
      metaLabel: 'Thẻ',
      render: (t) => {
        const card = cards.find((c) => c.id === t.cardId);
        return (
          <div className="truncate">
            <span className="font-medium text-[#2C1E26] dark:text-[#FFFFFF] text-[0.875rem]">
              {card?.bank || t.cardId}
            </span>
            <div data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] truncate">
              {card?.name || t.cardId}
            </div>
          </div>
        );
      }
    },
    {
      id: 'merchant',
      header: 'Đơn vị & MCC',
      width: '240px',
      priority: 1,
      mobile: 'title',
      render: (t) => (
        <div className="truncate min-w-0">
          <div className="font-medium text-[#2C1E26] dark:text-[#FFFFFF] text-[0.875rem] leading-[1.375rem] truncate">{t.merchant}</div>
          <div data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] truncate">
            MCC {t.mccCode} • {t.mccName || t.groupName || 'Chi tiêu'}
          </div>
        </div>
      )
    },
    {
      id: 'amount',
      header: 'Số tiền',
      width: '140px',
      align: 'right',
      priority: 1,
      mobile: 'value',
      render: (t) => (
        <span className="font-medium tabular-nums text-[#2C1E26] dark:text-[#FFFFFF] text-[0.875rem] leading-[1.375rem]">
          {formatCurrency(t.amount)}
        </span>
      )
    },
    {
      id: 'cashback',
      header: 'Tỷ lệ & Hoàn tiền',
      width: '150px',
      align: 'right',
      priority: 2,
      mobile: 'meta',
      metaLabel: 'Hoàn tiền',
      render: (t) => (
        <div className="text-right">
          <div className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400 text-[0.875rem] leading-[1.375rem]">
            +{formatCurrency(t.actualCashback)}
          </div>
          <div data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] tabular-nums">
            {formatRate(t.rate)}
          </div>
        </div>
      )
    },
    {
      id: 'cashbackStatus',
      header: 'Trạng thái hoàn',
      width: '140px',
      align: 'center',
      priority: 1,
      mobile: 'badge',
      render: (t) => {
        const isFull = t.cashbackStatus === 'Được hoàn';
        const isPartial = t.cashbackStatus === 'Hoàn một phần';
        const isCap = t.cashbackStatus === 'Đã đạt mức tối đa' || t.cashbackStatus === 'Đã đạt cap';

        return (
          <GlassBadge
            variant={isFull ? 'success' : isPartial ? 'warning' : isCap ? 'neutral' : 'neutral'}
            size="sm"
          >
            {mapCashbackStatus(t.cashbackStatus)}
          </GlassBadge>
        );
      }
    },
    {
      id: 'actions',
      header: 'Thao tác',
      width: '90px',
      align: 'center',
      priority: 1,
      mobile: 'hidden',
      render: (t) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(t);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#E27AA1] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer touch-target active:scale-95"
            title="Chỉnh sửa giao dịch"
            aria-label="Chỉnh sửa giao dịch"
          >
            <Edit2 className="w-4 h-4 stroke-[1.75px]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingTransaction(t);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#E11D48] hover:bg-rose-500/10 transition-colors cursor-pointer touch-target active:scale-95"
            title="Xóa giao dịch"
            aria-label="Xóa giao dịch"
          >
            <Trash2 className="w-4 h-4 stroke-[1.75px]" />
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <StandardPage
        title={vi.transactions.title}
        layoutTemplate="single-table"
        monthPicker={
          <GlassMonthPicker
            value={selectedMonth}
            onChange={(m) => {
              setSelectedMonth(m);
              setCurrentPage(1);
            }}
            isLoading={isFetching}
          />
        }
        primaryAction={
          <GlassButton
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4 stroke-[1.75px]" />}
            onClick={handleOpenCreate}
          >
            {vi.transactions.addTransaction}
          </GlassButton>
        }
        toolbar={
          <div className="flex items-center justify-between gap-3 w-full">
            {/* Left: Search input */}
            <div className="w-full sm:w-72">
              <GlassInput
                placeholder="Tìm giao dịch, thương hiệu..."
                leftIcon={<Search className="w-4 h-4 text-[#68515E] dark:text-[#D8C9D2] stroke-[1.75px]" />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Middle (Desktop): Quick filters for Card & Cashback Status */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-56">
                <GlassSelect
                  value={selectedCardId}
                  onChange={(e) => {
                    setSelectedCardId(e?.target?.value ?? e);
                    setCurrentPage(1);
                  }}
                  size="sm"
                  shape="pill"
                  searchable={true}
                  searchPlaceholder="Tìm thẻ..."
                  options={[
                    { value: 'ALL', label: 'Tất cả thẻ' },
                    ...cards.map((c) => ({
                      value: c.id,
                      label: `${c.bank} - ${c.name}`
                    }))
                  ]}
                />
              </div>

              <div className="w-52">
                <GlassSelect
                  value={selectedCashbackStatus}
                  onChange={(e) => {
                    setSelectedCashbackStatus(e?.target?.value ?? e);
                    setCurrentPage(1);
                  }}
                  size="sm"
                  shape="pill"
                  searchable={false}
                  options={[
                    { value: 'ALL', label: 'Tất cả hoàn tiền' },
                    { value: 'Được hoàn', label: 'Được hoàn' },
                    { value: 'Hoàn một phần', label: 'Hoàn một phần' },
                    { value: 'Đã đạt cap', label: 'Đã đạt mức tối đa' },
                    { value: 'Không được hoàn', label: 'Không được hoàn' }
                  ]}
                />
              </div>
            </div>

            {/* Right: Filter button for mobile or advanced modal */}
            <div className="flex items-center gap-2 shrink-0">
              <GlassButton
                variant={activeFilterCount > 0 ? 'primary' : 'secondary'}
                size="sm"
                data-testid="transactions-filter-btn"
                leftIcon={<Filter className="w-3.5 h-3.5 stroke-[1.75px]" />}
                onClick={() => setShowFilterSheet(true)}
              >
                <span>Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/30 text-[0.75rem] font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </GlassButton>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCardId('ALL');
                    setSelectedMcc('ALL');
                    setSelectedStatus('ALL');
                    setSelectedCashbackStatus('ALL');
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#E11D48] hover:bg-rose-500/10 transition-colors touch-target active:scale-95 cursor-pointer"
                  title="Đặt lại bộ lọc"
                >
                  <RotateCcw className="w-4 h-4 stroke-[1.75px]" />
                </button>
              )}
            </div>
          </div>
        }
        footer={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        }
      >
        <div className="h-full w-full glass-surface-tier1 rounded-2xl border border-white/70 overflow-hidden shadow-xs">
          <DataTable<Transaction>
            columns={columns}
            data={transactions}
            keyExtractor={(t) => t.id}
            isLoading={isLoading}
            emptyTitle="Không có giao dịch nào"
            emptyDescription={`Không tìm thấy giao dịch nào trong ${formatMonthLabel(selectedMonth)}.`}
            onRowClick={handleOpenEdit}
          />
        </div>
      </StandardPage>

      {/* Advanced Filters BottomSheet */}
      <BottomSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        title="Bộ lọc nâng cao giao dịch"
        testId="transactions-filter-sheet"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <GlassButton
              variant="secondary"
              size="md"
              onClick={() => {
                setSelectedCardId('ALL');
                setSelectedMcc('ALL');
                setSelectedStatus('ALL');
                setSelectedCashbackStatus('ALL');
                setCurrentPage(1);
              }}
            >
              Đặt lại
            </GlassButton>
            <GlassButton variant="primary" size="md" onClick={() => setShowFilterSheet(false)}>
              Áp dụng bộ lọc
            </GlassButton>
          </div>
        }
      >
        <div className="space-y-4 text-[0.8125rem]">
          <GlassSelect
            label="Thẻ tín dụng thanh toán"
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e?.target?.value ?? e)}
            searchable={true}
            searchPlaceholder="Tìm thẻ..."
            options={[
              { value: 'ALL', label: 'Tất cả các thẻ' },
              ...cards.map((c) => ({
                value: c.id,
                label: `${c.bank} - ${c.name}`
              }))
            ]}
          />

          <GlassSelect
            label="Trạng thái hoàn tiền"
            value={selectedCashbackStatus}
            onChange={(e) => setSelectedCashbackStatus(e?.target?.value ?? e)}
            searchable={false}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'Được hoàn', label: 'Được hoàn' },
              { value: 'Hoàn một phần', label: 'Hoàn một phần' },
              { value: 'Đã đạt cap', label: 'Đã đạt mức tối đa' },
              { value: 'Không được hoàn', label: 'Không được hoàn' }
            ]}
          />

          <GlassSelect
            label="Mã ngành hàng (MCC)"
            value={selectedMcc}
            onChange={(e) => setSelectedMcc(e?.target?.value ?? e)}
            searchable={true}
            searchPlaceholder="Tìm mã MCC hoặc ngành..."
            options={[
              { value: 'ALL', label: 'Tất cả ngành hàng' },
              ...mccList.map((m) => ({
                value: m.code,
                label: `${m.code} - ${m.name}`
              }))
            ]}
          />
        </div>
      </BottomSheet>

      {/* Transaction Add / Edit DetailDrawer */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingTransaction ? vi.transactions.editTransaction : vi.transactions.addTransaction}
        subtitle={editingTransaction ? `${editingTransaction.merchant} - ${formatDate(editingTransaction.date)}` : 'Ghi nhận chi tiêu thẻ tín dụng mới'}
        width="860px"
        footer={
          <FormActions
            onCancel={() => setIsDrawerOpen(false)}
            onSave={handleSubmit}
            onDelete={editingTransaction ? () => setDeletingTransaction(editingTransaction) : undefined}
            isSaving={createMutation.isPending || updateMutation.isPending}
            saveLabel={vi.common.save}
            cancelLabel={vi.common.cancel}
            deleteLabel={vi.common.delete}
          />
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* CỘT 1: THẺ, NGÀY & MERCHANT */}
            <div className="space-y-3.5">
              <GlassSelect
                label="Thẻ tín dụng thanh toán"
                value={form.cardId}
                onChange={(e) => setForm({ ...form, cardId: e?.target?.value ?? e })}
                searchable={true}
                searchPlaceholder="Tìm thẻ tín dụng..."
                options={cards.map((c) => ({
                  value: c.id,
                  label: `${c.bank} - ${c.name}`
                }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <GlassInput
                  label="Ngày giao dịch"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                <GlassSelect
                  label="Mã ngành hàng (MCC)"
                  value={form.mccCode}
                  onChange={(e) => setForm({ ...form, mccCode: e?.target?.value ?? e })}
                  searchable={true}
                  searchPlaceholder="Tìm mã MCC hoặc ngành..."
                  options={mccList.map((m) => ({
                    value: m.code,
                    label: `${m.code} - ${m.name}`
                  }))}
                />
              </div>

              <GlassInput
                label="Đơn vị chấp nhận thẻ (Merchant)"
                required
                placeholder="VD: Shopee, Grab, Starbucks, WinMart..."
                value={form.merchant}
                onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              />

              <GlassCurrencyInput
                label="Số tiền chi tiêu (VNĐ)"
                required
                value={form.amount}
                onChange={(val) => setForm({ ...form, amount: parseInt(val, 10) || 0 })}
              />
            </div>

            {/* CỘT 2: DỰ KIẾN HOÀN TIỀN & TRẠNG THÁI */}
            <div className="space-y-3.5 flex flex-col justify-between">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#E27AA1]/10 via-[#F8C8DC]/20 to-white/60 dark:to-white/10 border border-[#E27AA1]/30 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[0.8125rem] leading-[1.125rem]">
                  <span className="font-medium text-[#E27AA1] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 stroke-[1.75px]" />
                    Dự kiến kết quả hoàn tiền
                  </span>
                  {isPreviewLoading && (
                    <span data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] animate-pulse">Đang tính...</span>
                  )}
                  {previewResult && !isPreviewLoading && (
                    <GlassBadge variant={previewResult.actualCashback > 0 ? 'success' : 'neutral'} size="sm">
                      {previewResult.cashbackStatus}
                    </GlassBadge>
                  )}
                </div>

                {previewResult ? (
                  <div className="space-y-2 pt-1 text-[0.8125rem] leading-[1.125rem]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#68515E] dark:text-[#D8C9D2]">Tỷ lệ hoàn tiền:</span>
                      <span className="font-medium text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums">{formatRate(previewResult.rate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#68515E] dark:text-[#D8C9D2]">Số tiền hoàn thực nhận:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[1rem] leading-[1.5rem] tabular-nums">
                        +{formatCurrency(previewResult.actualCashback)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] pt-1">
                    Nhập số tiền và chọn thẻ/MCC để xem ngay mức hoàn tiền dự kiến.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <GlassSelect
                  label="Trạng thái giao dịch"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  options={[
                    { value: 'Posted', label: 'Đã ghi nợ (Posted)' },
                    { value: 'Pending', label: 'Đang xử lý (Pending)' },
                    { value: 'Cancelled', label: 'Đã hủy (Cancelled)' }
                  ]}
                />
                <GlassSelect
                  label="Tình trạng thanh toán"
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                  options={[
                    { value: 'Chưa thanh toán', label: 'Chưa thanh toán' },
                    { value: 'Đã thanh toán', label: 'Đã thanh toán' }
                  ]}
                />
              </div>

              <GlassInput
                label="Ghi chú giao dịch"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Ghi chú chi tiêu..."
              />
            </div>
          </div>
        </form>
      </DetailDrawer>

      {/* Delete Confirmation StandardDialog */}
      <StandardDialog
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        title="Xác nhận xóa giao dịch"
        subtitle={`Bạn có chắc muốn xóa giao dịch ${deletingTransaction?.merchant} (${formatCurrency(deletingTransaction?.amount || 0)}) không?`}
        footer={
          <FormActions
            onCancel={() => setDeletingTransaction(null)}
            onSave={() => deletingTransaction && deleteMutation.mutate(deletingTransaction.id)}
            isSaving={deleteMutation.isPending}
            saveLabel={vi.common.delete}
            cancelLabel={vi.common.cancel}
            saveVariant="danger"
          />
        }
      >
        <p data-role="caption" className="text-[0.75rem] leading-[1rem] text-rose-700 dark:text-rose-300 font-normal">
          Giao dịch sau khi xóa sẽ được trừ khỏi tổng chi tiêu và tự động tính toán lại hoàn tiền của tháng.
        </p>
      </StandardDialog>
    </>
  );
};
