import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GlassButton } from '../glass/GlassButton';
import { vi } from '../../i18n/vi';

export interface FormActionsProps {
  onCancel?: () => void;
  onSubmit?: (e?: any) => void;
  onSave?: (e?: any) => void;
  onDelete?: () => void;
  submitLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  deleteLabel?: string;
  saveVariant?: 'primary' | 'danger' | 'secondary';
  isSubmitting?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  submitDisabled?: boolean;
  deleteDisabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  onSubmit,
  onSave,
  onDelete,
  submitLabel,
  saveLabel,
  cancelLabel = vi.common.cancel,
  deleteLabel = vi.common.delete,
  saveVariant = 'primary',
  isSubmitting = false,
  isSaving = false,
  isDeleting = false,
  submitDisabled = false,
  deleteDisabled = false,
  className,
  children,
}) => {
  const finalSubmitAction = onSave || onSubmit;
  const finalSubmitLabel = saveLabel || submitLabel || vi.common.save;
  const finalIsSubmitting = isSaving || isSubmitting;

  return (
    <div
      data-testid="form-actions"
      className={twMerge(
        clsx(
          'w-full h-[64px] max-md:h-[72px] px-5 max-md:px-4 flex items-center justify-between gap-3',
          'border-t border-black/5 dark:border-white/10 mt-auto shrink-0 pb-safe',
          className
        )
      )}
    >
      {/* Left-aligned Delete action (if provided) */}
      <div>
        {onDelete && (
          <GlassButton
            type="button"
            variant="danger"
            size="md"
            onClick={onDelete}
            isLoading={isDeleting}
            disabled={deleteDisabled || finalIsSubmitting}
            className="min-w-[88px]"
          >
            {deleteLabel}
          </GlassButton>
        )}
      </div>

      {/* Right-aligned Cancel and Submit actions */}
      <div className="flex items-center gap-3 ml-auto">
        {children}

        {onCancel && (
          <GlassButton
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={finalIsSubmitting || isDeleting}
            className="min-w-[88px]"
          >
            {cancelLabel}
          </GlassButton>
        )}

        <GlassButton
          type={finalSubmitAction ? 'button' : 'submit'}
          variant={saveVariant}
          size="md"
          onClick={finalSubmitAction}
          isLoading={finalIsSubmitting}
          disabled={submitDisabled || isDeleting}
          className="min-w-[88px]"
        >
          {finalSubmitLabel}
        </GlassButton>
      </div>
    </div>
  );
};
