import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type TextVariant =
  | 'display'
  | 'body'
  | 'body-strong'
  | 'label'
  | 'caption'
  | 'caption-strong';

export type TextColor =
  | 'main'
  | 'muted'
  | 'dim'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'inherit';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  color?: TextColor;
  as?: React.ElementType;
  tabular?: boolean;
  dataRole?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'main',
  as: Component = 'span',
  tabular = false,
  dataRole,
  className,
  children,
  ...props
}) => {
  const variantClasses: Record<TextVariant, string> = {
    display: 'text-[clamp(1.5rem,1.25rem+0.8vw,1.75rem)] leading-[clamp(2rem,1.75rem+0.8vw,2.25rem)] font-semibold',
    body: 'text-[0.875rem] max-md:text-[0.9375rem] leading-[1.375rem] font-normal',
    'body-strong': 'text-[0.875rem] max-md:text-[0.9375rem] leading-[1.375rem] font-medium',
    label: 'text-[0.8125rem] leading-[1.125rem] font-medium',
    caption: 'text-[0.75rem] leading-[1rem] font-normal',
    'caption-strong': 'text-[0.75rem] leading-[1rem] font-medium',
  };

  const colorClasses: Record<TextColor, string> = {
    main: 'text-[#2C1E26] dark:text-[#FFFFFF]',
    muted: 'text-[#68515E] dark:text-[#D8C9D2]',
    dim: 'text-[#8E7583] dark:text-[#9E8B97]',
    primary: 'text-[#E27AA1]',
    danger: 'text-[#E11D48]',
    success: 'text-[#059669]',
    warning: 'text-[#D97706]',
    inherit: 'text-inherit',
  };

  return (
    <Component
      data-role={dataRole || variant}
      className={twMerge(
        clsx(
          variantClasses[variant],
          colorClasses[color],
          tabular && 'tabular-nums',
          className
        )
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
