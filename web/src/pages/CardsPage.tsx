import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Trash2, Edit2, CreditCard, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import type { Card, AppSettings } from '../types';
import { vi, mapCardStatus } from '../i18n/vi';
import { formatCurrency } from '../lib/formatters';
import { StandardPage } from '../components/layout/StandardPage';
import { DataTable, type DataTableColumn } from '../components/layout/DataTable';
import { Pagination } from '../components/layout/Pagination';
import { DetailDrawer } from '../components/layout/DetailDrawer';
import { StandardDialog } from '../components/layout/StandardDialog';
import { FormActions } from '../components/layout/FormActions';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassInput } from '../components/glass/GlassInput';
import { GlassCurrencyInput } from '../components/glass/GlassCurrencyInput';
import { GlassSelect } from '../components/glass/GlassSelect';
import { GlassBadge } from '../components/glass/GlassBadge';
import { useToast } from '../components/glass/Toast';

export const CardsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    bank: 'VPBank',
    name: '',
    cardType: 'Credit',
    network: 'Visa',
    last4: '',
    creditLimit: 50000000,
    statementDay: 20,
    paymentDueDay: 5,
    openDate: new Date().toISOString().split('T')[0],
    annualFee: 0,
    firstYearFee: 0,
    status: 'Active',
    note: ''
  });

  const { data: cards = [], isLoading } = useQuery<Card[]>({
    queryKey: ['cards'],
    queryFn: () => api.get<Card[]>('/api/cards')
  });

  // Query App Settings for Bank list
  const { data: settings } = useQuery<AppSettings>({
    queryKey: ['settings'],
    queryFn: () => api.get<AppSettings>('/api/settings'),
  });

  const bankOptions = useMemo(() => {
    const defaultList = [
      'VPBank', 'VIB', 'Techcombank', 'MB', 'TPBank', 'Sacombank', 'ACB',
      'Vietcombank', 'VietinBank', 'BIDV', 'HSBC', 'Standard Chartered',
      'Shinhan Bank', 'UOB', 'Citibank'
    ];
    const list = settings?.banks && settings.banks.length > 0 ? settings.banks : defaultList;
    const currentBank = formData.bank;
    const items = currentBank && !list.includes(currentBank) ? [currentBank, ...list] : list;
    return items.map((b) => ({ value: b, label: b }));
  }, [settings?.banks, formData.bank]);

  const createMutation = useMutation({
    mutationFn: (newCard: any) => api.post('/api/cards', newCard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['card-statuses'] });
      setIsDrawerOpen(false);
      resetForm();
      toast.success('Thêm thẻ tín dụng mới thành công!');
    },
    onError: (err: any) => {
      setFormError(err.message || vi.errors.networkError);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/cards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['card-statuses'] });
      setIsDrawerOpen(false);
      resetForm();
      toast.success('Cập nhật thông tin thẻ thành công!');
    },
    onError: (err: any) => {
      setFormError(err.message || vi.errors.networkError);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/cards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['card-statuses'] });
      setDeletingCard(null);
      toast.success('Đã xóa thẻ tín dụng thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xóa thẻ thất bại');
    }
  });

  const resetForm = () => {
    setEditingCard(null);
    setFormError(null);
    setFormData({
      id: '',
      bank: 'VPBank',
      name: '',
      cardType: 'Credit',
      network: 'Visa',
      last4: '',
      creditLimit: 50000000,
      statementDay: 20,
      paymentDueDay: 5,
      openDate: new Date().toISOString().split('T')[0],
      annualFee: 0,
      firstYearFee: 0,
      status: 'Active',
      note: ''
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (card: Card) => {
    setEditingCard(card);
    setFormError(null);
    setFormData({
      id: card.id,
      bank: card.bank,
      name: card.name,
      cardType: card.cardType,
      network: card.network,
      last4: card.last4,
      creditLimit: card.creditLimit,
      statementDay: card.statementDay,
      paymentDueDay: card.paymentDueDay,
      openDate: card.openDate,
      annualFee: card.annualFee,
      firstYearFee: card.firstYearFee,
      status: card.status,
      note: card.note || ''
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError(vi.errors.fieldRequired);
      return;
    }
    if (!/^\d{4}$/.test(formData.last4.trim())) {
      setFormError('4 số cuối thẻ phải gồm đúng 4 chữ số.');
      return;
    }

    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, data: formData });
    } else {
      if (!formData.id.trim()) {
        setFormError('Vui lòng nhập mã định danh thẻ (VD: TCB-EVERYDAY).');
        return;
      }
      createMutation.mutate(formData);
    }
  };

  // Filtering
  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.last4.includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = filteredCards.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedCards = filteredCards.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // DataTable Columns Definition
  const columns: DataTableColumn<Card>[] = [
    {
      id: 'name',
      header: 'Thẻ tín dụng',
      width: '260px',
      priority: 1,
      sticky: true,
      mobile: 'title',
      render: (c) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E27AA1]/20 to-[#F8C8DC]/30 text-[#E27AA1] flex items-center justify-center shrink-0 font-semibold text-[0.8125rem]">
            <CreditCard className="w-4 h-4 stroke-[1.75px]" />
          </div>
          <div className="truncate min-w-0">
            <div className="font-medium text-[#2C1E26] dark:text-[#FFFFFF] text-[0.875rem] leading-[1.375rem] truncate">{c.name}</div>
            <div data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] truncate">
              {c.bank} • •••• {c.last4}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'id',
      header: 'Mã thẻ',
      width: '140px',
      priority: 2,
      mobile: 'subtitle',
      render: (c) => (
        <span className="font-mono text-[0.8125rem] leading-[1.125rem] text-[#68515E] dark:text-[#D8C9D2]">
          {c.id}
        </span>
      )
    },
    {
      id: 'creditLimit',
      header: 'Hạn mức',
      width: '160px',
      align: 'right',
      priority: 1,
      mobile: 'value',
      render: (c) => (
        <span className="font-medium tabular-nums text-[#2C1E26] dark:text-[#FFFFFF] text-[0.875rem] leading-[1.375rem]">
          {formatCurrency(c.creditLimit)}
        </span>
      )
    },
    {
      id: 'cycle',
      header: 'Chu kỳ sao kê & Hạn TT',
      width: '200px',
      priority: 2,
      mobile: 'meta',
      metaLabel: 'Sao kê & Hạn TT',
      render: (c) => (
        <span data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2]">
          Sao kê ngày {c.statementDay} • Hạn ngày {c.paymentDueDay}
        </span>
      )
    },
    {
      id: 'status',
      header: 'Trạng thái',
      width: '120px',
      align: 'center',
      priority: 1,
      mobile: 'badge',
      render: (c) => (
        <GlassBadge
          variant={c.status === 'Active' ? 'success' : c.status === 'Inactive' ? 'warning' : 'neutral'}
          size="sm"
        >
          {mapCardStatus(c.status)}
        </GlassBadge>
      )
    },
    {
      id: 'actions',
      header: 'Thao tác',
      width: '90px',
      align: 'center',
      priority: 1,
      mobile: 'hidden',
      render: (c) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(c);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#E27AA1] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer touch-target active:scale-95"
            title="Chỉnh sửa thẻ"
            aria-label="Chỉnh sửa thẻ"
          >
            <Edit2 className="w-4 h-4 stroke-[1.75px]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingCard(c);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#68515E] dark:text-[#D8C9D2] hover:text-[#E11D48] hover:bg-rose-500/10 transition-colors cursor-pointer touch-target active:scale-95"
            title="Xóa thẻ"
            aria-label="Xóa thẻ"
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
        title={vi.cards.title}
        description={vi.cards.subtitle}
        layoutTemplate="single-table"
        primaryAction={
          <GlassButton
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4 stroke-[1.75px]" />}
            onClick={handleOpenCreate}
          >
            {vi.cards.addCard}
          </GlassButton>
        }
        toolbar={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            {/* Search Input */}
            <div className="w-full sm:w-80">
              <GlassInput
                placeholder={vi.cards.searchPlaceholder}
                leftIcon={<Search className="w-4 h-4 text-[#68515E] dark:text-[#D8C9D2] stroke-[1.75px]" />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
              {[
                { key: 'ALL', label: vi.common.all },
                { key: 'Active', label: vi.cards.statusActive },
                { key: 'Inactive', label: vi.cards.statusInactive },
                { key: 'Closed', label: vi.cards.statusClosed },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(item.key);
                    setCurrentPage(1);
                  }}
                  className={`h-[32px] px-3.5 rounded-full text-[0.8125rem] leading-[1.125rem] font-medium transition-all whitespace-nowrap cursor-pointer touch-target ${
                    statusFilter === item.key
                      ? 'bg-[#E27AA1] text-white shadow-xs'
                      : 'bg-white/40 dark:bg-white/5 text-[#68515E] dark:text-[#D8C9D2] hover:bg-white/60 border border-white/40 dark:border-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
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
          <DataTable<Card>
            columns={columns}
            data={paginatedCards}
            keyExtractor={(c) => c.id}
            isLoading={isLoading}
            emptyTitle={vi.cards.noCardsFound}
            emptyDescription={vi.cards.noCardsPrompt}
            onRowClick={handleOpenEdit}
          />
        </div>
      </StandardPage>

      {/* Card Detail / Edit Slide-over Drawer */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingCard ? vi.cards.editCard : vi.cards.addCard}
        subtitle={editingCard ? `${editingCard.bank} - ${editingCard.id}` : 'Nhập thông tin thẻ tín dụng mới'}
        width="860px"
        footer={
          <FormActions
            onCancel={() => setIsDrawerOpen(false)}
            onSave={handleSubmit}
            onDelete={editingCard ? () => setDeletingCard(editingCard) : undefined}
            isSaving={createMutation.isPending || updateMutation.isPending}
            saveLabel={vi.common.save}
            cancelLabel={vi.common.cancel}
            deleteLabel={vi.common.delete}
          />
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div data-role="caption" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#E11D48] text-[0.75rem] leading-[1rem] font-normal flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75px]" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* CỘT 1: THÔNG TIN ĐỊNH DANH & THẺ */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassInput
                  label="Mã định danh thẻ (ID)"
                  required
                  disabled={!!editingCard}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                  placeholder="VD: VIB-SUPERCARD"
                />
                <GlassSelect
                  label="Ngân hàng phát hành"
                  searchable
                  searchPlaceholder="Tìm ngân hàng..."
                  value={formData.bank}
                  onChange={(val) => setFormData({ ...formData, bank: typeof val === 'string' ? val : val?.target?.value ?? '' })}
                  options={bankOptions}
                />
              </div>

              <GlassInput
                label="Tên hiển thị của thẻ"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: VIB Super Card Amex"
              />

              <div className="grid grid-cols-3 gap-2.5">
                <GlassSelect
                  label="Tổ chức thẻ"
                  value={formData.network}
                  onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                  options={[
                    { value: 'Visa', label: 'Visa' },
                    { value: 'Mastercard', label: 'Mastercard' },
                    { value: 'JCB', label: 'JCB' },
                    { value: 'Amex', label: 'Amex' },
                    { value: 'Napas', label: 'Napas' }
                  ]}
                />
                <GlassSelect
                  label="Loại thẻ"
                  value={formData.cardType}
                  onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                  options={[
                    { value: 'Credit', label: 'Tín dụng' },
                    { value: 'Cashback', label: 'Hoàn tiền' },
                    { value: 'Platinum', label: 'Platinum' },
                    { value: 'Signature', label: 'Signature' }
                  ]}
                />
                <GlassInput
                  label="4 số cuối"
                  required
                  maxLength={4}
                  value={formData.last4}
                  onChange={(e) => setFormData({ ...formData, last4: e.target.value.replace(/\D/g, '') })}
                  placeholder="1234"
                />
              </div>

              <GlassInput
                label="Ghi chú & Ưu đãi"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Ghi chú đặc quyền hoặc điều kiện..."
              />
            </div>

            {/* CỘT 2: HẠN MỨC, SAO KÊ & TRẠNG THÁI */}
            <div className="space-y-3.5">
              <GlassCurrencyInput
                label="Hạn mức tín dụng (VNĐ)"
                required
                value={formData.creditLimit}
                onChange={(val) => setFormData({ ...formData, creditLimit: parseInt(val, 10) || 0 })}
              />

              <div className="grid grid-cols-2 gap-3">
                <GlassInput
                  label="Ngày sao kê hàng tháng"
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={formData.statementDay.toString()}
                  onChange={(e) => setFormData({ ...formData, statementDay: parseInt(e.target.value, 10) || 1 })}
                />
                <GlassInput
                  label="Hạn thanh toán hàng tháng"
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={formData.paymentDueDay.toString()}
                  onChange={(e) => setFormData({ ...formData, paymentDueDay: parseInt(e.target.value, 10) || 1 })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <GlassCurrencyInput
                  label="Phí thường niên (VNĐ)"
                  value={formData.annualFee}
                  onChange={(val) => setFormData({ ...formData, annualFee: parseInt(val, 10) || 0 })}
                />
                <GlassSelect
                  label="Trạng thái thẻ"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'Active', label: 'Đang dùng' },
                    { value: 'Inactive', label: 'Tạm ngưng' },
                    { value: 'Closed', label: 'Đã đóng' }
                  ]}
                />
              </div>
            </div>
          </div>
        </form>
      </DetailDrawer>

      {/* Delete Confirmation StandardDialog */}
      <StandardDialog
        isOpen={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        title="Xác nhận xóa thẻ tín dụng"
        subtitle={`Bạn có chắc chắn muốn xóa thẻ ${deletingCard?.name} (${deletingCard?.bank}) không? Thao tác này không thể hoàn tác.`}
        footer={
          <FormActions
            onCancel={() => setDeletingCard(null)}
            onSave={() => deletingCard && deleteMutation.mutate(deletingCard.id)}
            isSaving={deleteMutation.isPending}
            saveLabel={vi.common.delete}
            cancelLabel={vi.common.cancel}
            saveVariant="danger"
          />
        }
      >
        <div data-role="caption" className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[0.75rem] leading-[1rem] text-rose-800 dark:text-rose-300 font-normal">
          Lưu ý: Các giao dịch và quy tắc hoàn tiền liên quan đến thẻ này sẽ bị ảnh hưởng.
        </div>
      </StandardDialog>
    </>
  );
};
