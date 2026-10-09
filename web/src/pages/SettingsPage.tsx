import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  KeyRound,
  Building2,
  Tag,
  FileSpreadsheet,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  Clock,
  UserCheck,
  Layers,
  CreditCard,
  Percent,
  Plus,
} from 'lucide-react';
import { api } from '../lib/api';
import type { AppSettings } from '../types';
import { vi } from '../i18n/vi';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassInput } from '../components/glass/GlassInput';
import { GlassSkeleton } from '../components/glass/CountUp';
import { StandardPage } from '../components/layout/StandardPage';
import { GlassBlock } from '../components/layout/GlassBlock';
import { useToast } from '../components/glass/Toast';

type SettingsTab = 'thresholds' | 'banks' | 'categories' | 'password' | 'export';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('thresholds');

  // Query Settings
  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ['settings'],
    queryFn: () => api.get<AppSettings>('/api/settings'),
  });

  // Thresholds Form State
  const [thresholdForm, setThresholdForm] = useState({
    utilizationMild: '50',
    utilizationWarning: '70',
    utilizationDanger: '90',
    dueSoonDays: '5',
    nearCapThreshold: '80',
  });

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setThresholdForm({
        utilizationMild: (settings.utilizationMildThreshold * 100).toString(),
        utilizationWarning: (settings.utilizationWarningThreshold * 100).toString(),
        utilizationDanger: (settings.utilizationDangerThreshold * 100).toString(),
        dueSoonDays: settings.dueSoonDays.toString(),
        nearCapThreshold: (settings.nearCapThreshold * 100).toString(),
      });
    }
  }, [settings]);

  // Bank & Category Manager States
  const [newBank, setNewBank] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (payload: any) => api.put('/api/settings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['card-statuses'] });
      showToast({ message: vi.settings.saveSuccess, variant: 'success' });
    },
    onError: (err: any) => {
      showToast({ message: err.message || 'Lưu cài đặt thất bại', variant: 'error' });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => api.post('/api/auth/change-password', payload),
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError('');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast({ message: vi.settings.passwordChangedSuccess, variant: 'success' });
    },
    onError: (err: any) => {
      setPasswordSuccess(false);
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        vi.errors.passwordChangeFailed;
      setPasswordError(errMsg);
      showToast({ message: errMsg, variant: 'error' });
    },
  });

  const handleSaveThresholds = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    const payload = {
      utilizationMildThreshold: parseFloat(thresholdForm.utilizationMild) / 100,
      utilizationWarningThreshold: parseFloat(thresholdForm.utilizationWarning) / 100,
      utilizationDangerThreshold: parseFloat(thresholdForm.utilizationDanger) / 100,
      dueSoonDays: parseInt(thresholdForm.dueSoonDays, 10),
      nearCapThreshold: parseFloat(thresholdForm.nearCapThreshold) / 100,
      banks: settings.banks,
      categories: settings.categories,
    };
    updateSettingsMutation.mutate(payload);
  };

  const handleAddBank = () => {
    if (!newBank.trim() || !settings) return;
    if (settings.banks.includes(newBank.trim())) return;
    const updated = [...settings.banks, newBank.trim()];
    updateSettingsMutation.mutate({
      ...settings,
      banks: updated,
    });
    setNewBank('');
  };

  const handleRemoveBank = (b: string) => {
    if (!settings) return;
    const updated = settings.banks.filter((x) => x !== b);
    updateSettingsMutation.mutate({
      ...settings,
      banks: updated,
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.trim() || !settings) return;
    if (settings.categories.includes(newCategory.trim())) return;
    const updated = [...settings.categories, newCategory.trim()];
    updateSettingsMutation.mutate({
      ...settings,
      categories: updated,
    });
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (!settings) return;
    const updated = settings.categories.filter((x) => x !== cat);
    updateSettingsMutation.mutate({
      ...settings,
      categories: updated,
    });
  };

  const handleChangePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(vi.errors.passwordMismatch);
      return;
    }

    if (passwordForm.newPassword.length < 10) {
      setPasswordError(vi.errors.passwordLength);
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleDownloadExcel = async () => {
    try {
      setIsExporting(true);
      const res = await api.download('/api/export/excel');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Credit_Card_Manager_Export_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
      alert('Xuất tệp Excel thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsExporting(false);
    }
  };

  const mildVal = parseFloat(thresholdForm.utilizationMild) || 50;
  const warnVal = parseFloat(thresholdForm.utilizationWarning) || 70;
  const dangVal = parseFloat(thresholdForm.utilizationDanger) || 90;
  const banksCount = settings?.banks?.length || 0;
  const categoriesCount = settings?.categories?.length || 0;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'thresholds', label: vi.settings.tabThresholds, icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'banks', label: vi.settings.tabBanks, icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'categories', label: vi.settings.tabCategories, icon: <Tag className="w-3.5 h-3.5" /> },
    { id: 'password', label: vi.settings.tabAccount, icon: <KeyRound className="w-3.5 h-3.5" /> },
    { id: 'export', label: vi.settings.tabExport, icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
  ];

  return (
    <StandardPage
      title={vi.settings.title}
      description={vi.settings.subtitle}
      layoutTemplate="single-table"
      testId="settings-page"
      toolbar={
        <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`settings-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer touch-target ${
                  isActive
                    ? 'bg-[#E27AA1] text-white shadow-xs'
                    : 'bg-white/60 hover:bg-white/90 text-[#826B76] hover:text-[#3B2A33]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between text-xs text-[#826B76]">
          <span>{vi.settings.title}</span>
          <span>{tabs.find((t) => t.id === activeTab)?.label}</span>
        </div>
      }
    >
      {isLoading || !settings ? (
        <GlassSkeleton height={420} />
      ) : activeTab === 'thresholds' ? (
        /* TAB 1: THRESHOLDS */
        <GlassBlock
          title={vi.settings.utilizationThresholds}
          subtitle="Cấu hình cảnh báo hạn mức & ngày thanh toán"
          icon={<Sliders className="w-4 h-4" />}
          testId="settings-thresholds-block"
          footer={
            <div className="w-full flex items-center justify-between gap-3">
              <span className="text-xs text-[#826B76] truncate hidden sm:inline">
                Áp dụng ngay lập tức cho toàn bộ các thẻ
              </span>
              <GlassButton
                variant="primary"
                size="md"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={updateSettingsMutation.isPending}
                onClick={() => handleSaveThresholds()}
              >
                {vi.settings.saveThresholds}
              </GlassButton>
            </div>
          }
          bodyClassName="p-4 sm:p-6 space-y-5"
        >
          <form onSubmit={handleSaveThresholds} className="space-y-5">
            {/* 3 Utilization Threshold Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-[16px] bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <span>{vi.settings.mild}</span>
                  <span className="font-mono">{thresholdForm.utilizationMild}%</span>
                </div>
                <GlassInput
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={thresholdForm.utilizationMild}
                  onChange={(e) =>
                    setThresholdForm({ ...thresholdForm, utilizationMild: e.target.value })
                  }
                />
              </div>

              <div className="p-3.5 rounded-[16px] bg-orange-500/10 border border-orange-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-orange-800 dark:text-orange-300">
                  <span>{vi.settings.warning}</span>
                  <span className="font-mono">{thresholdForm.utilizationWarning}%</span>
                </div>
                <GlassInput
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={thresholdForm.utilizationWarning}
                  onChange={(e) =>
                    setThresholdForm({ ...thresholdForm, utilizationWarning: e.target.value })
                  }
                />
              </div>

              <div className="p-3.5 rounded-[16px] bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-800 dark:text-rose-300">
                  <span>{vi.settings.danger}</span>
                  <span className="font-mono">{thresholdForm.utilizationDanger}%</span>
                </div>
                <GlassInput
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={thresholdForm.utilizationDanger}
                  onChange={(e) =>
                    setThresholdForm({ ...thresholdForm, utilizationDanger: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Visual Zone Indicator */}
            <div className="space-y-1.5 p-3.5 rounded-[16px] glass-surface-tier2 border border-white/40 dark:border-white/10">
              <div className="flex items-center justify-between text-xs font-semibold text-[#826B76] dark:text-[#BDACB5]">
                <span>Phân vùng cảnh báo tỷ lệ sử dụng</span>
                <span className="font-mono">100%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden flex p-0.5 border border-white/60 dark:border-white/10">
                <div style={{ width: `${mildVal}%` }} className="bg-emerald-400 rounded-l-full transition-all" />
                <div style={{ width: `${Math.max(0, warnVal - mildVal)}%` }} className="bg-amber-400 transition-all" />
                <div style={{ width: `${Math.max(0, dangVal - warnVal)}%` }} className="bg-orange-400 transition-all" />
                <div style={{ width: `${Math.max(0, 100 - dangVal)}%` }} className="bg-rose-500 rounded-r-full transition-all" />
              </div>
            </div>

            {/* 2 Additional Settings Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-[16px] glass-surface-tier2 border border-white/40 dark:border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#3B2A33] dark:text-[#F6EDF2]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    {vi.settings.dueSoonDays}
                  </span>
                  <span className="font-mono text-purple-700 dark:text-purple-400">{thresholdForm.dueSoonDays} ngày</span>
                </div>
                <GlassInput
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={thresholdForm.dueSoonDays}
                  onChange={(e) =>
                    setThresholdForm({ ...thresholdForm, dueSoonDays: e.target.value })
                  }
                />
              </div>

              <div className="p-3.5 rounded-[16px] glass-surface-tier2 border border-white/40 dark:border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#3B2A33] dark:text-[#F6EDF2]">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-pink-500" />
                    {vi.settings.nearCapThreshold}
                  </span>
                  <span className="font-mono text-pink-700 dark:text-pink-400">{thresholdForm.nearCapThreshold}%</span>
                </div>
                <GlassInput
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={thresholdForm.nearCapThreshold}
                  onChange={(e) =>
                    setThresholdForm({ ...thresholdForm, nearCapThreshold: e.target.value })
                  }
                />
              </div>
            </div>
          </form>
        </GlassBlock>
      ) : activeTab === 'banks' ? (
        /* TAB 2: BANKS */
        <GlassBlock
          title={vi.settings.bankList}
          subtitle={`${banksCount} ngân hàng`}
          icon={<Building2 className="w-4 h-4" />}
          testId="settings-banks-block"
          footer={
            <div className="w-full flex items-center justify-between text-xs text-[#826B76]">
              <span>Tổng cộng: <strong className="text-[#3B2A33] dark:text-[#F6EDF2] font-mono">{banksCount}</strong></span>
              <span>Dùng trong danh mục thẻ tín dụng</span>
            </div>
          }
          bodyClassName="p-0 flex flex-col h-full min-h-0 overflow-hidden"
        >
          {/* Cố định thanh nhập & nút Thêm ở trên cùng */}
          <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/10 shrink-0 glass-surface-tier2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <GlassInput
                  placeholder={vi.settings.addBank}
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBank();
                    }
                  }}
                />
              </div>
              <GlassButton
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleAddBank}
              >
                {vi.common.add}
              </GlassButton>
            </div>
          </div>

          {/* Danh sách ngân hàng cuộn độc lập bên dưới */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 overscroll-contain min-h-0">
            {settings.banks.map((b) => (
              <div
                key={b}
                className="flex items-center justify-between p-3 px-4 rounded-[12px] glass-surface-tier2 hover:bg-white/80 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#826B76]" />
                  <span className="font-semibold text-[#3B2A33] dark:text-[#F6EDF2]">{b}</span>
                </div>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={() => handleRemoveBank(b)}
                  aria-label="Xóa ngân hàng"
                  title="Xóa ngân hàng"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </GlassButton>
              </div>
            ))}
          </div>
        </GlassBlock>
      ) : activeTab === 'categories' ? (
        /* TAB 3: CATEGORIES */
        <GlassBlock
          title={vi.settings.categoryList}
          subtitle={`${categoriesCount} danh mục`}
          icon={<Tag className="w-4 h-4" />}
          testId="settings-categories-block"
          footer={
            <div className="w-full flex items-center justify-between text-xs text-[#826B76]">
              <span>Tổng cộng: <strong className="text-[#3B2A33] dark:text-[#F6EDF2] font-mono">{categoriesCount}</strong></span>
              <span>Dùng để phân loại quy tắc & báo cáo</span>
            </div>
          }
          bodyClassName="p-0 flex flex-col h-full min-h-0 overflow-hidden"
        >
          {/* Cố định thanh nhập & nút Thêm ở trên cùng */}
          <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/10 shrink-0 glass-surface-tier2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <GlassInput
                  placeholder={vi.settings.addCategory}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
              </div>
              <GlassButton
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleAddCategory}
              >
                {vi.common.add}
              </GlassButton>
            </div>
          </div>

          {/* Danh sách danh mục cuộn độc lập bên dưới */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 overscroll-contain min-h-0">
            {settings.categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between p-3 px-4 rounded-[12px] glass-surface-tier2 hover:bg-white/80 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-[#826B76]" />
                  <span className="font-semibold text-[#3B2A33] dark:text-[#F6EDF2]">{cat}</span>
                </div>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={() => handleRemoveCategory(cat)}
                  aria-label="Xóa danh mục"
                  title="Xóa danh mục"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </GlassButton>
              </div>
            ))}
          </div>
        </GlassBlock>
      ) : activeTab === 'password' ? (
        /* TAB 4: PASSWORD */
        <GlassBlock
          title={vi.settings.accountSecurity}
          subtitle="Đổi mật khẩu tài khoản quản trị"
          icon={<KeyRound className="w-4 h-4" />}
          testId="settings-password-block"
          footer={
            <div className="w-full flex items-center justify-end">
              <GlassButton
                variant="primary"
                size="md"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                isLoading={changePasswordMutation.isPending}
                onClick={() => handleChangePasswordSubmit()}
              >
                {vi.settings.updatePassword}
              </GlassButton>
            </div>
          }
          bodyClassName="p-4 sm:p-6 space-y-4"
        >
          {/* User Account Chip */}
          <div className="p-3.5 rounded-[16px] glass-surface-tier2 border border-white/40 dark:border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E27AA1]/15 text-[#E27AA1] flex items-center justify-center font-semibold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#826B76] dark:text-[#BDACB5]">Tài khoản hiện tại</div>
              <div className="text-sm font-semibold text-[#3B2A33] dark:text-[#F6EDF2]">
                taitv <span className="text-xs font-semibold text-[#E27AA1]">(Quản trị viên)</span>
              </div>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3 rounded-[12px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{vi.settings.passwordChangedSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-[12px] bg-[#D64560]/15 border border-[#D64560]/30 text-[#D64560] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-1">
            <GlassInput
              label={vi.settings.currentPassword}
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
            />

            <GlassInput
              label={vi.settings.newPassword}
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
            />

            <GlassInput
              label={vi.settings.confirmNewPassword}
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
            />
          </form>

          <div className="p-3 rounded-[12px] bg-black/5 dark:bg-white/5 text-xs text-[#826B76] dark:text-[#BDACB5] space-y-1">
            <div className="font-semibold text-[#3B2A33] dark:text-[#F6EDF2]">Yêu cầu mật khẩu:</div>
            <div>• Tối thiểu 10 ký tự</div>
            <div>• Chứa chữ hoa (A-Z), chữ thường (a-z), chữ số (0-9) và ký tự đặc biệt (!@#$%^&*)</div>
          </div>
        </GlassBlock>
      ) : (
        /* TAB 5: EXPORT */
        <GlassBlock
          title={vi.settings.tabExport}
          subtitle="Xuất toàn bộ cơ sở dữ liệu ra bảng tính"
          icon={<FileSpreadsheet className="w-4 h-4" />}
          testId="settings-export-block"
          footer={
            <div className="w-full flex items-center justify-between text-xs text-[#826B76]">
              <span>Định dạng tệp .xlsx</span>
              <span>Bao gồm 4 bảng dữ liệu</span>
            </div>
          }
          bodyClassName="p-4 sm:p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-[12px] glass-surface-tier2 border border-white/40 dark:border-white/10 flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-[#E27AA1]" />
              <div>
                <strong className="block text-[#3B2A33] dark:text-[#F6EDF2]">1. Danh sách Thẻ</strong>
                <span className="text-[#826B76] dark:text-[#BDACB5]">Hạn mức, chu kỳ sao kê</span>
              </div>
            </div>

            <div className="p-3 rounded-[12px] glass-surface-tier2 border border-white/40 dark:border-white/10 flex items-center gap-2.5">
              <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div>
                <strong className="block text-[#3B2A33] dark:text-[#F6EDF2]">2. Quy tắc hoàn tiền</strong>
                <span className="text-[#826B76] dark:text-[#BDACB5]">Tỷ lệ %, trần hoàn tiền</span>
              </div>
            </div>

            <div className="p-3 rounded-[12px] glass-surface-tier2 border border-white/40 dark:border-white/10 flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <div>
                <strong className="block text-[#3B2A33] dark:text-[#F6EDF2]">3. Mã ngành MCC</strong>
                <span className="text-[#826B76] dark:text-[#BDACB5]">Phân loại ngành tiêu dùng</span>
              </div>
            </div>

            <div className="p-3 rounded-[12px] glass-surface-tier2 border border-white/40 dark:border-white/10 flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <strong className="block text-[#3B2A33] dark:text-[#F6EDF2]">4. Sổ giao dịch</strong>
                <span className="text-[#826B76] dark:text-[#BDACB5]">Lịch sử và hoàn tiền</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center space-y-3">
            <p className="text-xs text-[#826B76] dark:text-[#BDACB5]">
              {vi.settings.exportExcelDesc}
            </p>
            <GlassButton
              variant="primary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              isLoading={isExporting}
              onClick={handleDownloadExcel}
              className="w-full sm:w-auto px-8"
            >
              {vi.settings.downloadExcel}
            </GlassButton>
          </div>
        </GlassBlock>
      )}
    </StandardPage>
  );
};

export default SettingsPage;
