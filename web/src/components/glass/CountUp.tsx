import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const GlassSkeleton: React.FC<{ className?: string; height?: number | string; width?: number | string }> = ({
  className,
  height,
  width
}) => {
  return (
    <div
      style={{ height, width }}
      className={twMerge(
        clsx(
          'relative overflow-hidden rounded-[16px] bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10',
          'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent after:animate-[shimmer_1.8s_infinite]',
          className
        )
      )}
    />
  );
};

export interface CountUpProps {
  value: number;
  duration?: number;
  currency?: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatter?: (val: number) => string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 1.2,
  currency = false,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatter
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  if (formatter) {
    return <span>{formatter(displayValue)}</span>;
  }

  if (currency) {
    return (
      <span>
        {new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0
        }).format(displayValue)}
      </span>
    );
  }

  return (
    <span>
      {prefix}
      {new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals
      }).format(displayValue)}
      {suffix}
    </span>
  );
};
