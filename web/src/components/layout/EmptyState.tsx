import React from 'react';
import { Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  testId?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  testId,
}) => {
  return (
    <div
      data-testid={testId || 'empty-state'}
      className="flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-4 my-auto h-full min-h-[220px]"
    >
      <div className="w-16 h-16 rounded-full bg-[#E27AA1]/10 text-[#E27AA1] flex items-center justify-center shadow-xs border border-[#E27AA1]/20">
        {icon || <Sparkles className="w-8 h-8 stroke-[1.75px]" />}
      </div>
      <div className="max-w-md space-y-1.5">
        <h4 data-role="block-title" className="text-[16px] leading-[24px] font-semibold text-[#2C1E26] dark:text-[#FFFFFF]">
          {title}
        </h4>
        {description && (
          <p data-role="caption" className="text-[13px] leading-[18px] text-[#68515E] dark:text-[#D8C9D2] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </div>
  );
};
