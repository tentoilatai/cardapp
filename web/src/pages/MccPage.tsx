import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Plus, Edit2, Trash2, 
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import type { Mcc } from '../types';
import { vi } from '../i18n/vi';
import { StandardPage } from '../components/layout/StandardPage';
import { DataTable, type DataTableColumn } from '../components/layout/DataTable';
import { Pagination } from '../components/layout/Pagination';
import { DetailDrawer } from '../components/layout/DetailDrawer';
import { StandardDialog } from '../components/layout/StandardDialog';
import { FormActions } from '../components/layout/FormActions';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassInput } from '../components/glass/GlassInput';
import { GlassBadge } from '../components/glass/GlassBadge';
import { GlassSelect } from '../components/glass/GlassSelect';
import { useToast } from '../components/glass/Toast';

export const MccPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Drawer / modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMcc, setEditingMcc] = useState<Mcc | null>(null);
  const [deletingMcc, setDeletingMcc] = useState<Mcc | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Ẩm thực',
    subcategory: '',
    description: '',
  });

  // Queries
  const { data: mccList = [], isLoading } = useQuery<Mcc[]>({
    queryKey: ['mcc-list', searchTerm, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'ALL') params.append('category', selectedCategory);
      return api.get<Mcc[]>(`/api/mcc?${params.toString()}`);
    }
  });

  const { data: allMcc = [] } = useQuery<Mcc[]>({
    queryKey: ['mcc-all-categories'],
    queryFn: () => api.get<Mcc[]>('/api/mcc')
  });

  const categories = Array.from(new Set(allMcc.map(m => m.category).filter(Boolean)));

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/api/mcc', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-list'] });
      queryClient.invalidateQueries({ queryKey: ['mcc-all'] });
      setIsDrawerOpen(false);
      showToast({ message: 'Đã thêm mã MCC thành công', variant: 'success' });
    },
    onError: (err: any) => {
      setFormError(err.message || vi.errors.networkError);
      showToast({ message: err.message || 'Thêm mã MCC thất bại', variant: 'error' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ code, payload }: { code: string; payload: any }) => 
      api.put(`/api/mcc/${code}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-list'] });
      queryClient.invalidateQueries({ queryKey: ['mcc-all'] });
      setIsDrawerOpen(false);
      setEditingMcc(null);
      showToast({ message: 'Đã cập nhật mã MCC', variant: 'success' });
    },
    onError: (err: any) => {
      setFormError(err.message || vi.errors.networkError);
      showToast({ message: err.message || 'Cập nhật mã MCC thất bại', variant: 'error' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => api.delete(`/api/mcc/${code}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-list'] });
      queryClient.invalidateQueries({ queryKey: ['mcc-all'] });
      setDeletingMcc(null);
      showToast({ message: 'Đã xóa mã MCC', variant: 'info' });
    },
    onError: (err: any) => {
      showToast({ message: err.message || 'Xóa mã MCC thất bại', variant: 'error' });
    }
  });

  const handleOpenAdd = () => {
    setEditingMcc(null);
    setFormError(null);
    setForm({
      code: '',
      name: '',
      category: 'Ẩm thực',
      subcategory: '',
      description: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (mcc: Mcc) => {
    setEditingMcc(mcc);
    setFormError(null);
    setForm({
      code: mcc.code,
      name: mcc.name,
      category: mcc.category || 'Ẩm thực',
      subcategory: mcc.subcategory || '',
      description: mcc.description || '',
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || form.code.length !== 4) {
      setFormError('Mã MCC phải gồm đúng 4 chữ số.');
      return;
    }
    if (!form.name.trim()) {
      setFormError('Vui lòng nhập tên ngành hàng.');
      return;
    }

    if (editingMcc) {
      updateMutation.mutate({ code: editingMcc.code, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const totalCount = mccList.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedMccs = mccList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // DataTable columns (4 columns standard)
  const columns: DataTableColumn<Mcc>[] = [
    {
      id: 'code',
      header: 'Mã MCC',
      width: '120px',
      priority: 1,
      sticky: true,
      mobile: 'value',
      render: (m) => (
        <span className="font-mono font-semibold text-xs text-[#E27AA1]">
          {m.code}
        </span>
      )
    },
    {
      id: 'name',
      header: 'Tên ngành hàng',
      width: '260px',
      priority: 1,
      mobile: 'title',
      render: (m) => (
        <div className="truncate">
          <div className="font-semibold text-sm text-[#3B2A33] dark:text-[#F6EDF2] truncate">{m.name}</div>
          {m.subcategory && (
            <div className="text-xs text-[#826B76] dark:text-[#BDACB5] truncate">{m.subcategory}</div>
          )}
        </div>
      )
    },
    {
      id: 'category',
      header: 'Danh mục chính',
      width: '180px',
      priority: 2,
      mobile: 'subtitle',
      render: (m) => (
        <GlassBadge variant="neutral" size="sm">
          {m.category || 'Chung'}
        </GlassBadge>
      )
    },
    {
      id: 'description',
      header: 'Diễn giải & Ví dụ tại Việt Nam',
      width: '360px',
      priority: 2,
      mobile: 'meta',
      metaLabel: 'Ví dụ',
      render: (m) => (
        <span className="text-xs text-[#826B76] dark:text-[#BDACB5] truncate block" title={m.description || ''}>
          {m.description || '—'}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Thao tác',
      width: '90px',
      align: 'center',
      priority: 1,
      mobile: 'hidden',
      render: (m) => (
        <div className="flex items-center justify-center gap-1.5">
          <GlassButton
            variant="ghost"
            size="sm"
            iconOnly
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(m);
            }}
            aria-label="Chỉnh sửa mã MCC"
            title="Chỉnh sửa mã MCC"
          >
            <Edit2 className="w-4 h-4" />
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            iconOnly
            onClick={(e) => {
              e.stopPropagation();
              setDeletingMcc(m);
            }}
            aria-label="Xóa mã MCC"
            title="Xóa mã MCC"
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </GlassButton>
        </div>
      )
    }
  ];

  return (
    <>
      <StandardPage
        title={vi.mcc.title}
        description={vi.mcc.subtitle}
        layoutTemplate="single-table"
        primaryAction={
          <GlassButton
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            {vi.mcc.addMcc}
          </GlassButton>
        }
        toolbar={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            {/* Search */}
            <div className="w-full sm:w-80">
              <GlassInput
                placeholder={vi.mcc.searchPlaceholder}
                leftIcon={<Search className="w-4 h-4 text-[#826B76]" />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Category select */}
            <div className="w-full sm:w-72">
              <GlassSelect
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e?.target?.value ?? e);
                  setCurrentPage(1);
                }}
                size="sm"
                shape="pill"
                searchable={true}
                searchPlaceholder="Tìm danh mục..."
                options={[
                  { value: 'ALL', label: `Tất cả danh mục (${categories.length})` },
                  ...categories.map((c) => ({
                    value: c,
                    label: c
                  }))
                ]}
              />
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
        <div className="h-full w-full glass-surface-dense rounded-[24px] border border-white/70 overflow-hidden shadow-xs">
          <DataTable<Mcc>
            columns={columns}
            data={paginatedMccs}
            keyExtractor={(m) => m.code}
            isLoading={isLoading}
            emptyTitle={vi.mcc.noMccFound}
            emptyDescription="Thử nhập từ khóa khác hoặc nhấn Thêm mã MCC mới."
            onRowClick={handleOpenEdit}
          />
        </div>
      </StandardPage>

      {/* Add / Edit MCC DetailDrawer */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingMcc ? vi.mcc.editMcc : vi.mcc.addMcc}
        subtitle={editingMcc ? `Mã MCC ${editingMcc.code}` : 'Khai báo mã phân loại ngành hàng mới'}
        width="620px"
        footer={
          <FormActions
            onDelete={editingMcc ? () => setDeletingMcc(editingMcc) : undefined}
            deleteLabel={vi.common.delete}
            onCancel={() => setIsDrawerOpen(false)}
            cancelLabel={vi.common.cancel}
            onSave={handleSubmit}
            saveLabel={vi.common.save}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4.5">
          {formError && (
            <div className="p-3.5 rounded-[12px] bg-rose-500/10 border border-rose-500/20 text-[#D64560] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Mã MCC & Danh mục chính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Mã MCC (4 chữ số)"
              required
              disabled={!!editingMcc}
              maxLength={4}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
              placeholder="VD: 5411"
            />
            <GlassInput
              label="Danh mục chính"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="VD: Ẩm thực, Siêu thị..."
            />
          </div>

          {/* Row 2: Tên ngành hàng & Phân nhóm phụ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Tên ngành hàng hiển thị"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Nhà hàng ẩm thực, quán ăn..."
            />
            <GlassInput
              label="Phân nhóm phụ (Subcategory)"
              value={form.subcategory}
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              placeholder="VD: Fast Food, Coffee..."
            />
          </div>

          {/* Row 3: Diễn giải & Ví dụ */}
          <GlassInput
            label="Diễn giải & Ví dụ tại Việt Nam"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả ngành hàng và các thương hiệu phổ biến (Shopee, Grab, WinMart...)"
          />
        </form>
      </DetailDrawer>

      {/* Delete Confirmation StandardDialog */}
      <StandardDialog
        isOpen={!!deletingMcc}
        onClose={() => setDeletingMcc(null)}
        title="Xác nhận xóa mã ngành MCC"
        subtitle={`Bạn có chắc muốn xóa mã ngành ${deletingMcc?.code} (${deletingMcc?.name}) không?`}
        footer={
          <FormActions
            onCancel={() => setDeletingMcc(null)}
            cancelLabel={vi.common.cancel}
            onSave={() => deletingMcc && deleteMutation.mutate(deletingMcc.code)}
            saveLabel={vi.common.delete}
            saveVariant="danger"
            isSubmitting={deleteMutation.isPending}
          />
        }
      >
        <p className="text-xs text-rose-700">
          Lưu ý: Các quy tắc hoàn tiền và giao dịch đang tham chiếu mã MCC này sẽ bị ảnh hưởng.
        </p>
      </StandardDialog>
    </>
  );
};
