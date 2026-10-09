import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, 
  Trash2, Edit2, ChevronDown, ChevronUp, CreditCard
} from 'lucide-react';
import { api } from '../lib/api';
import type { CashbackRule, Card, Mcc } from '../types';
import { vi } from '../i18n/vi';
import { formatCurrency, formatRate } from '../lib/formatters';
import { StandardPage } from '../components/layout/StandardPage';
import { DetailDrawer } from '../components/layout/DetailDrawer';
import { StandardDialog } from '../components/layout/StandardDialog';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassInput } from '../components/glass/GlassInput';
import { GlassSelect } from '../components/glass/GlassSelect';
import { FormActions } from '../components/layout/FormActions';
import { useToast } from '../components/glass/Toast';

export const RulesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedCardId, setSelectedCardId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Accordion state per card
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Drawer / Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState<CashbackRule | null>(null);
  const [editingRule, setEditingRule] = useState<CashbackRule | null>(null);

  // Form State
  const [form, setForm] = useState({
    cardId: '',
    groupName: '',
    categoryName: '',
    mccCode: '5812',
    ratePercent: '10',
    maxCashbackPerGroupPerMonth: '',
    maxCashbackPerCardPerMonth: '',
    maxEligibleSpending: '',
    minTransaction: '',
    condition: '',
    note: '',
  });

  // Queries
  const { data: rules = [], isLoading: isLoadingRules } = useQuery<CashbackRule[]>({
    queryKey: ['rules', selectedCardId],
    queryFn: () => {
      const url = selectedCardId && selectedCardId !== 'ALL' 
        ? `/api/rules?cardId=${selectedCardId}`
        : '/api/rules';
      return api.get<CashbackRule[]>(url);
    }
  });

  const { data: cards = [] } = useQuery<Card[]>({
    queryKey: ['cards'],
    queryFn: () => api.get<Card[]>('/api/cards')
  });

  const { data: mccList = [] } = useQuery<Mcc[]>({
    queryKey: ['mcc-all'],
    queryFn: () => api.get<Mcc[]>('/api/mcc')
  });

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: (payload: any) => api.post('/api/rules', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsDrawerOpen(false);
      resetForm();
      showToast({ message: 'Đã thêm quy tắc hoàn tiền thành công', variant: 'success' });
    },
    onError: (err: any) => {
      showToast({ message: err.message || 'Thêm quy tắc thất bại', variant: 'error' });
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      api.put(`/api/rules/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsDrawerOpen(false);
      resetForm();
      showToast({ message: 'Đã cập nhật quy tắc hoàn tiền', variant: 'success' });
    },
    onError: (err: any) => {
      showToast({ message: err.message || 'Cập nhật quy tắc thất bại', variant: 'error' });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeletingRule(null);
      showToast({ message: 'Đã xóa quy tắc hoàn tiền', variant: 'info' });
    },
    onError: (err: any) => {
      showToast({ message: err.message || 'Xóa quy tắc thất bại', variant: 'error' });
    }
  });

  const resetForm = () => {
    setEditingRule(null);
    setForm({
      cardId: cards[0]?.id || '',
      groupName: '',
      categoryName: 'Ẩm thực',
      mccCode: '5812',
      ratePercent: '10',
      maxCashbackPerGroupPerMonth: '',
      maxCashbackPerCardPerMonth: '',
      maxEligibleSpending: '',
      minTransaction: '',
      condition: '',
      note: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (rule: CashbackRule) => {
    setEditingRule(rule);
    setForm({
      cardId: rule.cardId,
      groupName: rule.groupName || '',
      categoryName: rule.categoryName || '',
      mccCode: rule.mccCode,
      ratePercent: (rule.rate * 100).toString(),
      maxCashbackPerGroupPerMonth: rule.maxCashbackPerGroupPerMonth ? rule.maxCashbackPerGroupPerMonth.toString() : '',
      maxCashbackPerCardPerMonth: rule.maxCashbackPerCardPerMonth ? rule.maxCashbackPerCardPerMonth.toString() : '',
      maxEligibleSpending: rule.maxEligibleSpending ? rule.maxEligibleSpending.toString() : '',
      minTransaction: rule.minTransaction ? rule.minTransaction.toString() : '',
      condition: rule.condition || '',
      note: rule.note || '',
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cardId) {
      alert('Vui lòng chọn thẻ.');
      return;
    }
    if (!form.mccCode) {
      alert('Vui lòng chọn mã ngành MCC.');
      return;
    }

    const rate = parseFloat(form.ratePercent) / 100;
    if (isNaN(rate) || rate <= 0) {
      alert('Tỷ lệ hoàn tiền phải lớn hơn 0.');
      return;
    }

    const payload = {
      cardId: form.cardId,
      groupName: form.groupName?.trim() || form.categoryName?.trim() || 'Nhóm chung',
      categoryName: form.categoryName?.trim() || 'Khác',
      mccCode: form.mccCode,
      rate,
      maxCashbackPerGroupPerMonth: form.maxCashbackPerGroupPerMonth ? parseFloat(form.maxCashbackPerGroupPerMonth) : null,
      maxCashbackPerCardPerMonth: form.maxCashbackPerCardPerMonth ? parseFloat(form.maxCashbackPerCardPerMonth) : null,
      maxEligibleSpending: form.maxEligibleSpending ? parseFloat(form.maxEligibleSpending) : null,
      minTransaction: form.minTransaction ? parseFloat(form.minTransaction) : null,
      condition: form.condition?.trim() || null,
      note: form.note?.trim() || null,
    };

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, payload });
    } else {
      createRuleMutation.mutate(payload);
    }
  };

  const toggleCardAccordion = (cId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cId]: prev[cId] === undefined ? false : !prev[cId],
    }));
  };

  // Filter rules by search term
  const filteredRules = rules.filter((r) => {
    const card = cards.find((c) => c.id === r.cardId);
    const cardName = card ? `${card.bank} ${card.name}` : r.cardId;
    const matchSearch =
      cardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mccCode.includes(searchTerm);
    return matchSearch;
  });

  // Group rules by card
  const cardGroupMap: Record<string, CashbackRule[]> = {};
  cards.forEach((c) => {
    cardGroupMap[c.id] = [];
  });
  filteredRules.forEach((r) => {
    if (!cardGroupMap[r.cardId]) cardGroupMap[r.cardId] = [];
    cardGroupMap[r.cardId].push(r);
  });

  const cardsWithRules = cards.filter(
    (c) => (selectedCardId === 'ALL' || c.id === selectedCardId) && (cardGroupMap[c.id]?.length || 0) > 0
  );

  return (
    <>
      <StandardPage
        title={vi.rules.title}
        description={vi.rules.subtitle}
        layoutTemplate="single-table"
        primaryAction={
          <GlassButton
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            {vi.rules.addRule}
          </GlassButton>
        }
        toolbar={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            {/* Search */}
            <div className="w-full sm:w-80">
              <GlassInput
                placeholder="Tìm theo thẻ, danh mục, MCC..."
                leftIcon={<Search className="w-4 h-4 text-[#826B76]" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Card selector filter */}
            <div className="w-full sm:w-80">
              <GlassSelect
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e?.target?.value ?? e)}
                size="sm"
                shape="pill"
                searchable={true}
                searchPlaceholder="Tìm thẻ tín dụng..."
                options={[
                  { value: 'ALL', label: `Tất cả ${cards.length} thẻ tín dụng` },
                  ...cards.map((c) => ({
                    value: c.id,
                    label: `${c.bank} - ${c.name} (${cardGroupMap[c.id]?.length || 0} quy tắc)`
                  }))
                ]}
              />
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full text-xs text-[#826B76] dark:text-[#BDACB5] px-4 font-medium">
            <span>Tổng số: <strong className="text-[#3B2A33] dark:text-[#F6EDF2] tabular-nums">{filteredRules.length}</strong> quy tắc hoàn tiền</span>
            <span>Áp dụng trên: <strong className="text-[#3B2A33] dark:text-[#F6EDF2] tabular-nums">{cardsWithRules.length}</strong> thẻ đang hoạt động</span>
          </div>
        }
      >
        <div className="h-full w-full glass-surface-dense rounded-[24px] border border-white/70 overflow-y-auto p-4 space-y-4 shadow-xs">
          {isLoadingRules ? (
            <div className="p-8 text-center text-xs text-[#826B76]">Đang tải danh sách quy tắc hoàn tiền...</div>
          ) : cardsWithRules.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#826B76]">Không tìm thấy quy tắc hoàn tiền nào phù hợp.</div>
          ) : (
            cardsWithRules.map((card) => {
              const cardRulesList = cardGroupMap[card.id] || [];
              const isExpanded = expandedCards[card.id] !== false; // Default expanded

              return (
                <div
                  key={card.id}
                  className="rounded-[16px] glass-surface-tier2 border border-white/40 dark:border-white/10 overflow-hidden shadow-xs transition-all"
                >
                  {/* Sticky Accordion Header per Card */}
                  <div
                    onClick={() => toggleCardAccordion(card.id)}
                    className="p-4 px-5 flex items-center justify-between bg-white/70 dark:bg-white/10 hover:bg-white/90 cursor-pointer select-none border-b border-black/5 dark:border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E27AA1]/15 text-[#E27AA1] flex items-center justify-center font-semibold text-xs">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#3B2A33] dark:text-[#F6EDF2]">
                          {card.bank} - {card.name}
                        </div>
                        <div className="text-xs text-[#826B76] dark:text-[#BDACB5]">
                          Hạn mức: {formatCurrency(card.creditLimit)} • {cardRulesList.length} quy tắc hoàn tiền
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E27AA1]/10 text-[#E27AA1] text-xs font-semibold">
                        {cardRulesList.length} quy tắc
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#826B76]" /> : <ChevronDown className="w-4 h-4 text-[#826B76]" />}
                    </div>
                  </div>

                  {/* Rules list inside accordion */}
                  {isExpanded && (
                    <div className="divide-y divide-black/5 dark:divide-white/5">
                      {cardRulesList.map((rule) => {
                        const mccItem = mccList.find((m) => m.code === rule.mccCode);

                        return (
                          <div
                            key={rule.id}
                            className="p-3.5 px-5 flex items-center justify-between gap-4 hover:bg-black/2.5 dark:hover:bg-white/5 transition-colors text-xs"
                          >
                            <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                              {/* Col 1: Category & Group */}
                              <div>
                                <span className="font-semibold text-sm text-[#3B2A33] dark:text-[#F6EDF2]">
                                  {rule.categoryName}
                                </span>
                                <div className="text-xs text-[#826B76] dark:text-[#BDACB5]">
                                  {rule.groupName}
                                </div>
                              </div>

                              {/* Col 2: MCC code & description */}
                              <div>
                                <span className="font-mono font-semibold text-xs text-[#E27AA1]">
                                  MCC {rule.mccCode}
                                </span>
                                <div className="text-xs text-[#826B76] dark:text-[#BDACB5] truncate">
                                  {mccItem?.name || rule.mccCode}
                                </div>
                              </div>

                              {/* Col 3: Cashback Rate & Monthly Cap */}
                              <div className="sm:text-right">
                                <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  {formatRate(rule.rate)}
                                </span>
                                <div className="text-xs text-[#826B76] dark:text-[#BDACB5] tabular-nums">
                                  {rule.maxCashbackPerGroupPerMonth 
                                    ? `Trần: ${formatCurrency(rule.maxCashbackPerGroupPerMonth)}/tháng` 
                                    : 'Không giới hạn trần'}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <GlassButton
                                variant="ghost"
                                size="sm"
                                iconOnly
                                onClick={() => handleOpenEdit(rule)}
                                aria-label="Chỉnh sửa quy tắc"
                                title="Chỉnh sửa quy tắc"
                              >
                                <Edit2 className="w-4 h-4" />
                              </GlassButton>
                              <GlassButton
                                variant="ghost"
                                size="sm"
                                iconOnly
                                onClick={() => setDeletingRule(rule)}
                                aria-label="Xóa quy tắc"
                                title="Xóa quy tắc"
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </GlassButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </StandardPage>

      {/* Add / Edit Rule DetailDrawer */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingRule ? 'Chỉnh sửa quy tắc hoàn tiền' : 'Thêm quy tắc hoàn tiền mới'}
        subtitle={editingRule ? `Quy tắc ${editingRule.id}` : 'Thiết lập điều kiện hoàn tiền theo mã MCC'}
        width="820px"
        footer={
          <FormActions
            onDelete={editingRule ? () => setDeletingRule(editingRule) : undefined}
            deleteLabel={vi.common.delete}
            onCancel={() => setIsDrawerOpen(false)}
            cancelLabel={vi.common.cancel}
            onSave={handleSubmit}
            saveLabel={vi.common.save}
            isSubmitting={createRuleMutation.isPending || updateRuleMutation.isPending}
          />
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* CỘT 1: THẺ, MCC, TÊN NHÓM & DANH MỤC */}
            <div className="space-y-3.5">
              <GlassSelect
                label="Thẻ áp dụng"
                value={form.cardId}
                onChange={(e) => setForm({ ...form, cardId: e.target.value })}
                options={cards.map((c) => ({
                  value: c.id,
                  label: `${c.bank} - ${c.name}`
                }))}
              />
              <GlassSelect
                label="Mã ngành hàng (MCC)"
                value={form.mccCode}
                onChange={(e) => setForm({ ...form, mccCode: e.target.value })}
                options={mccList.map((m) => ({
                  value: m.code,
                  label: `${m.code} - ${m.name}`
                }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <GlassInput
                  label="Tên nhóm quy tắc"
                  required
                  placeholder="VD: Ẩm thực, Mua sắm..."
                  value={form.groupName}
                  onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                />
                <GlassInput
                  label="Tên danh mục chi tiêu"
                  required
                  placeholder="VD: Dining, Shopping..."
                  value={form.categoryName}
                  onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                />
              </div>
            </div>

            {/* CỘT 2: TỶ LỆ HOÀN, CAP & ĐIỀU KIỆN */}
            <div className="space-y-3.5">
              <GlassInput
                label="Tỷ lệ hoàn tiền (%)"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                required
                value={form.ratePercent}
                onChange={(e) => setForm({ ...form, ratePercent: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <GlassInput
                  label="Hạn mức nhóm/tháng (VNĐ)"
                  type="number"
                  placeholder="Không giới hạn"
                  value={form.maxCashbackPerGroupPerMonth}
                  onChange={(e) => setForm({ ...form, maxCashbackPerGroupPerMonth: e.target.value })}
                />
                <GlassInput
                  label="Hạn mức thẻ/tháng (VNĐ)"
                  type="number"
                  placeholder="Theo thẻ"
                  value={form.maxCashbackPerCardPerMonth}
                  onChange={(e) => setForm({ ...form, maxCashbackPerCardPerMonth: e.target.value })}
                />
              </div>
              <GlassInput
                label="Điều kiện áp dụng"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                placeholder="Ghi chú điều kiện hoặc ngoại lệ hoàn tiền..."
              />
            </div>
          </div>
        </form>
      </DetailDrawer>

      {/* Delete Rule Confirmation Dialog */}
      <StandardDialog
        isOpen={!!deletingRule}
        onClose={() => setDeletingRule(null)}
        title="Xác nhận xóa quy tắc hoàn tiền"
        subtitle={`Bạn có chắc muốn xóa quy tắc MCC ${deletingRule?.mccCode} của thẻ ${deletingRule?.cardId} không?`}
        footer={
          <FormActions
            onCancel={() => setDeletingRule(null)}
            cancelLabel={vi.common.cancel}
            onSave={() => deletingRule && deleteRuleMutation.mutate(deletingRule.id)}
            saveLabel={vi.common.delete}
            saveVariant="danger"
            isSubmitting={deleteRuleMutation.isPending}
          />
        }
      >
        <p className="text-xs text-rose-700">
          Sau khi xóa quy tắc, các giao dịch thuộc mã ngành này trong tương lai sẽ không được tính hoàn tiền tự động theo quy tắc này.
        </p>
      </StandardDialog>
    </>
  );
};
