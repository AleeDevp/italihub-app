import { cn } from '@/lib/utils';
import * as React from 'react';

type ChipVariant = 'solid' | 'soft' | 'outline' | 'ghost';
type ChipTone = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  selectable?: boolean;
  variant?: ChipVariant;
  tone?: ChipTone;
  size?: ChipSize;
  left?: React.ReactNode;
  right?: React.ReactNode;
  rounded?: 'md' | 'full';
}

// Indicator (left circle) colors per tone
const indicatorBorderByTone: Record<ChipTone, string> = {
  default: 'border-foreground/60 dark:border-foreground/70',
  primary: 'border-primary',
  secondary: 'border-secondary',
  success: 'border-emerald-600 dark:border-emerald-500',
  warning: 'border-amber-600 dark:border-amber-500',
  destructive: 'border-destructive',
};
const indicatorBgByTone: Record<ChipTone, string> = {
  default: 'bg-foreground',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-emerald-600 dark:bg-emerald-500',
  warning: 'bg-amber-600 dark:bg-amber-500',
  destructive: 'bg-destructive',
};

const toneBg: Record<
  ChipTone,
  { solid: string; soft: string } & { outline?: string; ghost?: string }
> = {
  default: {
    solid: 'bg-muted text-foreground',
    soft: 'bg-muted/60 text-foreground',
    outline: 'border-2 border-input text-foreground',
    ghost: 'hover:bg-muted/60',
  },
  primary: {
    solid: 'bg-primary text-primary-foreground',
    soft: 'bg-primary/10 text-primary',
    outline: 'border-2 border-primary text-primary',
    ghost: 'hover:bg-primary/10 text-primary',
  },
  secondary: {
    solid: 'bg-secondary text-secondary-foreground',
    soft: 'bg-secondary/60 text-secondary-foreground',
    outline: 'border-2 border-secondary text-secondary-foreground',
    ghost: 'hover:bg-secondary/60 text-secondary-foreground',
  },
  success: {
    solid: 'bg-emerald-600 text-white dark:bg-emerald-500',
    soft: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    outline: 'border-2 border-emerald-600 text-emerald-700 dark:text-emerald-300',
    ghost:
      'hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    solid: 'bg-amber-600 text-white dark:bg-amber-500',
    soft: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    outline: 'border-2 border-amber-600 text-amber-800 dark:text-amber-300',
    ghost: 'hover:bg-amber-100/60 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300',
  },
  destructive: {
    solid: 'bg-destructive text-destructive-foreground',
    soft: 'bg-destructive/10 text-destructive',
    outline: 'border-2 border-destructive text-destructive',
    ghost: 'hover:bg-destructive/10 text-destructive',
  },
};

const sizeMap: Record<ChipSize, string> = {
  sm: 'h-7 text-xs px-2.5',
  md: 'h-8 text-sm px-3',
  lg: 'h-9 text-sm px-3.5',
};

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      className,
      selected = false,
      selectable = false,
      variant = 'soft',
      tone = 'default',
      size = 'md',
      left,
      right,
      rounded = 'md',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const v = variant in toneBg[tone] ? variant : 'soft';
    const baseClasses = cn(
      'inline-flex items-center gap-2 whitespace-nowrap select-none align-middle',
      'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
      rounded === 'full' ? 'rounded-full' : 'rounded-md',
      sizeMap[size],
      v === 'outline' ? 'bg-transparent' : undefined,
      toneBg[tone][v as keyof (typeof toneBg)[typeof tone]],
      className
    );

    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        className={baseClasses}
        aria-pressed={selected}
        aria-selected={selected}
        data-selected={selected ? '' : undefined}
        disabled={disabled}
        {...props}
      >
        {selectable ? (
          <span
            className={cn(
              'relative inline-flex items-center justify-center w-[10px] h-[10px] rounded-full border-2 transition-colors',
              indicatorBorderByTone[tone],
              selected ? indicatorBgByTone[tone] : undefined
            )}
            aria-hidden="true"
          />
        ) : left ? (
          <span className="inline-flex items-center justify-center">{left}</span>
        ) : null}
        <span className="truncate">{children}</span>
        {right ? <span className="inline-flex items-center justify-center">{right}</span> : null}
      </button>
    );
  }
);
Chip.displayName = 'Chip';
