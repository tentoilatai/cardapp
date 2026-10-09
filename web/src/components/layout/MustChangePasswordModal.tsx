import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GlassDialog } from '../glass/GlassDialog';
import { GlassInput } from '../glass/GlassInput';
import { GlassButton } from '../glass/GlassButton';
import { Lock, ShieldAlert } from 'lucide-react';
import { vi } from '../../i18n/vi';

export const MustChangePasswordModal: React.FC = () => {
  const { user, mustChangePassword, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!mustChangePassword || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Mật khẩu mới yêu cầu tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(vi.auth.passwordMismatch);
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword(currentPassword, newPassword, confirmPassword);
    } catch (err: any) {
      setError(err.message || vi.errors.passwordChangeFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassDialog
      isOpen={mustChangePassword}
      onClose={() => {}} // Forced: cannot close until changed
      title={vi.auth.mustChangePasswordTitle}
      description={vi.auth.mustChangePasswordDesc}
      maxWidth="md"
    >
      <div className="mb-4 p-3.5 rounded-xl bg-[#D97706]/15 border border-[#D97706]/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5 stroke-[1.75px]" />
        <p data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] leading-relaxed font-normal">
          {vi.auth.passwordHint}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div data-role="caption" className="p-3 rounded-xl bg-[#E11D48]/15 border border-[#E11D48]/30 text-[0.75rem] leading-[1rem] text-[#E11D48] font-normal">
            {error}
          </div>
        )}

        <GlassInput
          label={vi.auth.currentPassword}
          type="password"
          required
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

        <div className="mt-2">
          <GlassButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="w-full font-medium"
          >
            {vi.auth.changePasswordSubmit}
          </GlassButton>
        </div>
      </form>
    </GlassDialog>
  );
};
