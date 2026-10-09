import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StandardPage } from '../components/layout/StandardPage';
import { GlassInput } from '../components/glass/GlassInput';
import { GlassButton } from '../components/glass/GlassButton';
import { useToast } from '../components/glass/Toast';
import { vi } from '../i18n/vi';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => api.post('/api/auth/change-password', payload),
    onSuccess: async () => {
      setIsSuccess(true);
      setError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
      showToast({ message: vi.settings.passwordChangedSuccess, variant: 'success' });
    },
    onError: (err: any) => {
      setIsSuccess(false);
      const errMsg = err.message || vi.errors.passwordChangeFailed;
      setError(errMsg);
      showToast({ message: errMsg, variant: 'error' });
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsSuccess(false);

    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(vi.errors.passwordMismatch);
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword
    });
  };

  return (
    <StandardPage
      title={vi.nav.changePassword}
      description="Thiết lập và cập nhật mật khẩu đăng nhập an toàn"
      layoutTemplate="form"
    >
      <div className="max-w-md mx-auto w-full pt-2 sm:pt-6">
        <div className="bg-white dark:bg-[#181822] border border-[#E5E7EB] dark:border-[#262634] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          {/* Header Info */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB] dark:border-[#262634]">
            <div className="w-10 h-10 rounded-xl bg-[#E27AA1]/15 text-[#E27AA1] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[1.75px]" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#2C1E26] dark:text-[#FFFFFF]">
                Tài khoản: <span className="text-[#E27AA1]">{user?.username}</span>
              </h2>
              <p className="text-xs text-[#68515E] dark:text-[#D8C9D2]">
                Mật khẩu mới yêu cầu tối thiểu 6 ký tự
              </p>
            </div>
          </div>

          {/* Success message */}
          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{vi.settings.passwordChangedSuccess}</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-[#E11D48]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label={vi.auth.currentPassword}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 stroke-[1.75px]" />}
              placeholder={vi.auth.currentPasswordPlaceholder}
            />

            <GlassInput
              label={vi.auth.newPassword}
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 stroke-[1.75px]" />}
              placeholder={vi.auth.newPasswordPlaceholder}
            />

            <GlassInput
              label={vi.auth.confirmPassword}
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 stroke-[1.75px]" />}
              placeholder={vi.auth.confirmPasswordPlaceholder}
            />

            <div className="pt-2 flex flex-col gap-2.5">
              <GlassButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={changePasswordMutation.isPending}
                className="w-full font-medium"
              >
                {vi.settings.updatePassword}
              </GlassButton>

              <GlassButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => navigate(-1)}
                className="w-full font-medium"
              >
                {vi.common.back}
              </GlassButton>
            </div>
          </form>
        </div>
      </div>
    </StandardPage>
  );
};
