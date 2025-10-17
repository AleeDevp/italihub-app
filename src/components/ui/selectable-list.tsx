import { cn } from '@/lib/utils';
import * as React from 'react';
import { BsCheck } from 'react-icons/bs';

export type SelectableOption<T extends string | number | boolean> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

export interface SelectableListProps<T extends string | number | boolean> {
  options: Array<SelectableOption<T>>;
  value: T | null | undefined;
  onChange: (val: T) => void;
  ariaLabel?: string;
  className?: string;
  itemClassName?: string;
  disabled?: boolean; // when true, entire list is disabled/muted
  orientation?: 'vertical' | 'horizontal'; // layout direction (default vertical)
  showIndicator?: boolean; // show the left circular indicator (default true)
  error?: boolean; // when true, shows error state with red ring
}

// Square indicator: when selected, show a check icon slightly larger than the square
function Indicator({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex w-[14px] h-[14px] rounded-[3px] border-2 transition-colors',
        selected ? 'border-pink-300' : 'border-neutral-300'
      )}
    >
      {selected && (
        <>
          <BsCheck
            className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-primary pointer-events-none"
            size={28}
            aria-hidden="true"
            stroke="white"
            strokeWidth={2}
          />
          <BsCheck
            className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-primary pointer-events-none"
            size={28}
            aria-hidden="true"
          />
        </>
      )}
    </span>
  );
}

// Overloads to improve inference in JSX for common primitive types
export function SelectableList(props: SelectableListProps<boolean>): React.ReactElement;
export function SelectableList(props: SelectableListProps<string>): React.ReactElement;
export function SelectableList(props: SelectableListProps<number>): React.ReactElement;
export function SelectableList<T extends string | number | boolean>(
  props: SelectableListProps<T>
): React.ReactElement {
  const {
    options,
    value,
    onChange,
    ariaLabel,
    className,
    itemClassName,
    disabled = false,
    orientation = 'vertical',
    showIndicator = true,
    error = false,
  } = props;

  const selectedBg = 'bg-white';
  const selectedText = 'text-primary';

  return (
    <div
      className={cn(
        'rounded-md bg-neutral-100 border shadow-xs overflow-hidden transition-all',
        orientation === 'horizontal' ? 'flex divide-x' : 'divide-y',
        disabled && 'opacity-60 grayscale pointer-events-none',
        error && 'ring-[3px] ring-destructive/20 border-destructive',
        className
      )}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      aria-invalid={error || undefined}
    >
      {options.map((opt, idx) => {
        const selected = value === opt.value;
        const tabIndex = selected ? 0 : idx === 0 ? 0 : -1;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled || opt.disabled || undefined}
            disabled={disabled || opt.disabled}
            tabIndex={tabIndex}
            onClick={() => !(disabled || opt.disabled) && onChange(opt.value)}
            className={cn(
              'group relative flex items-center px-3 py-2 text-neutral-500 text-left text-sm transition-colors',
              showIndicator ? 'gap-3' : 'gap-0 justify-center',
              orientation === 'horizontal' ? 'flex-1' : 'w-full',
              !selected && 'hover:bg-neutral-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected && selectedBg,
              itemClassName
            )}
          >
            {showIndicator && <Indicator selected={selected} />}
            <span className={cn('truncate', selected && 'font-medium', selected && selectedText)}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
