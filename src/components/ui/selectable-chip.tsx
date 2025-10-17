'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

type SelectableChipProps = React.HTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  onSelect?: (next: boolean) => void;
  icon?: React.ReactNode;
  label: React.ReactNode;
  ariaLabel?: string;
};

export function SelectableChip({
  selected = false,
  onSelect,
  icon,
  label,
  className,
  ariaLabel,
  ...props
}: SelectableChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={(e) => {
        props.onClick?.(e as any);
        onSelect?.(!selected);
      }}
      className={cn(
        // outer container: sets size, rounding and perspective
        'relative inline-flex items-center gap-2 px-1 py-1 rounded-full text-sm transition-transform focus:outline-none',
        className
      )}
      {...props}
    >
      {/* back bevel layer: subtle outer border and light gradient */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 rounded-full pointer-events-none transition-colors',
          selected
            ? 'bg-gradient-to-br from-primary/90 to-primary/70 shadow-[0_6px_14px_rgba(0,0,0,0.12)]'
            : 'bg-gradient-to-br from-neutral-100 to-neutral-200 shadow-[0_4px_8px_rgba(15,15,15,0.04)]'
        )}
        style={{
          // a tiny inner border highlight to enhance bevel
          boxShadow: selected
            ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 14px rgba(2,6,23,0.12)'
            : 'inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 8px rgba(2,6,23,0.04)',
        }}
      />

      {/* front surface: content area slightly inset to create layered effect */}
      <span
        aria-hidden
        className={cn(
          'relative inline-flex items-center gap-2 px-3 py-1 rounded-full',
          'backdrop-blur-[1px] bg-transparent',
          selected ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        {icon && <span className="shrink-0 text-lg">{icon}</span>}
        <span className="leading-none font-medium">{label}</span>
      </span>

      {/* (dismiss badge removed per request) */}

      <style jsx>{`
        button:active > span[aria-hidden] {
          transform: translateY(1px) scale(0.998);
        }
        button:focus-visible {
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
        }
      `}</style>
    </button>
  );
}

export default SelectableChip;
