import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  height?: number | string;
  width?: number | string;
}

export const GlassSkeleton: React.FC<GlassSkeletonProps> = ({ className, height, width, style, ...props }) => {
  return (
    <div
      style={{ height, width, ...style }}
      className={twMerge(
        clsx(
          'relative overflow-hidden rounded-full bg-white/20 dark:bg-white/05 border border-white/30 dark:border-white/10',
          className
        )
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.8s_infinite]" />
    </div>
  );
};
