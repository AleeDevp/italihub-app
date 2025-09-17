import * as React from 'react';

import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'ring' | 'dots' | 'bars' | 'pulse';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
}

const sizeMap: Record<SpinnerSize, { box: string; dot: string; barH: string }> = {
  sm: { box: 'h-4 w-4', dot: 'h-1 w-1', barH: 'h-3' },
  md: { box: 'h-5 w-5', dot: 'h-1.5 w-1.5', barH: 'h-3.5' },
  lg: { box: 'h-6 w-6', dot: 'h-2 w-2', barH: 'h-4' },
  xl: { box: 'h-8 w-8', dot: 'h-2.5 w-2.5', barH: 'h-5' },
};

export function LoadingSpinner({
  size = 'md',
  variant = 'ring',
  label = 'Loading…',
  className,
  ...props
}: LoadingSpinnerProps) {
  const { box, dot, barH } = sizeMap[size];

  const base = 'inline-flex items-center justify-center text-muted-foreground';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(base, className)}
      {...props}
    >
      {variant === 'ring' && (
        <div
          className={cn(
            'rounded-full border-2 border-current/20 border-t-current animate-spin',
            box
          )}
        />
      )}

      {variant === 'dots' && (
        <div className={cn('flex items-center gap-0.5 mt-1')} aria-hidden>
          <span
            className={cn('rounded-full bg-current/70 animate-bounce', dot)}
            style={{ animationDelay: '0ms' }}
          />
          <span
            className={cn('rounded-full bg-current/70 animate-bounce', dot)}
            style={{ animationDelay: '150ms' }}
          />
          <span
            className={cn('rounded-full bg-current/70 animate-bounce', dot)}
            style={{ animationDelay: '300ms' }}
          />
        </div>
      )}

      {variant === 'bars' && (
        <div className={cn('flex items-end gap-0.5')} aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn('w-1 rounded-sm bg-current/70 animate-pulse', barH)}
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      )}

      {variant === 'pulse' && (
        <div className={cn('relative', box)} aria-hidden>
          <span className={cn('absolute inset-0 rounded-full bg-current/20 animate-ping')} />
          <span className={cn('absolute inset-0 rounded-full bg-current/40')} />
        </div>
      )}

      <span className="sr-only">{label}</span>
    </div>
  );
}

export default LoadingSpinner;
