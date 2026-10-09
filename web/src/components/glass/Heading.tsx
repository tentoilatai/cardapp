import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type HeadingLevel = 'title-1' | 'title-2';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span';
  dataRole?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 'title-2',
  as: Component = level === 'title-1' ? 'h1' : 'h2',
  dataRole,
  className,
  children,
  ...props
}) => {
  const levelClasses: Record<HeadingLevel, string> = {
    'title-1': 'text-[clamp(1.125rem,1rem+0.4vw,1.25rem)] leading-[clamp(1.625rem,1.5rem+0.4vw,1.75rem)] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight',
    'title-2': 'text-[1rem] leading-[1.5rem] font-semibold text-[#2C1E26] dark:text-[#FFFFFF] tracking-tight',
  };

  return (
    <Component
      data-role={dataRole || level}
      className={twMerge(clsx(levelClasses[level], className))}
      {...props}
    >
      {children}
    </Component>
  );
};
