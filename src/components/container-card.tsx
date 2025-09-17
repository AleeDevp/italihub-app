import { cn } from '@/lib/utils';
import * as React from 'react';

export interface ContainerCardProps extends React.ComponentProps<'div'> {
  variant?: 'top' | 'middle' | 'bottom';
  size?: 'sm' | 'default' | 'lg' | 'xl';
  gap?: '2' | '4' | '6' | '8';
  outerClassName?: string;
  innerClassName?: string;
  gapClassName?: string;
  children?: React.ReactNode;
  innerChildren?: React.ReactNode;
  gapChildren?: React.ReactNode;
}

const ContainerCard = React.forwardRef<HTMLDivElement, ContainerCardProps>(
  (
    {
      className,
      outerClassName,
      innerClassName,
      gapClassName,
      variant = 'top',
      size = 'default',
      gap = '4',
      children,
      innerChildren,
      gapChildren,
      ...props
    },
    ref
  ) => {
    const getSizeClass = () => {
      switch (size) {
        case 'sm':
          return 'container-card-sm';
        case 'lg':
          return 'container-card-lg';
        case 'xl':
          return 'container-card-xl';
        default:
          return '';
      }
    };

    const getGapClass = () => {
      if (gap !== '4') {
        return `container-card-gap-${gap}`;
      }
      return '';
    };

    const outerCardStyles = cn(
      'relative bg-card text-card-foreground border shadow-lg',
      // Use CSS custom property for outer radius
      'rounded-[var(--container-card-outer-radius)]',
      // Inner shadow for depth
      'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
      // Enhanced outer shadow
      'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3),0_2px_4px_-1px_rgba(0,0,0,0.2)]',
      // Default padding
      'p-2',
      // Size and gap classes for CSS custom properties
      getSizeClass(),
      getGapClass(),
      outerClassName
    );

    // Inner card positioning based on variant
    const getInnerCardPosition = () => {
      switch (variant) {
        case 'top':
          return 'justify-start items-start';
        case 'middle':
          return 'justify-center items-center';
        case 'bottom':
          return 'justify-end items-end';
        default:
          return 'justify-start items-start';
      }
    };

    const innerCardStyles = cn(
      'bg-card text-card-foreground border',
      // Use computed CSS custom property for inner radius (outer radius - gap)
      'rounded-[var(--container-card-inner-radius)]',
      // Only outer shadow, harmonious with outer card
      'shadow-md shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]',
      'dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.25),0_2px_4px_-1px_rgba(0,0,0,0.15)]',
      // Default inner card padding
      'p-3',
      innerClassName
    );

    // Gap area styling - flexible space between cards
    const gapAreaStyles = cn('flex-1 min-h-0', gapClassName);

    return (
      <div ref={ref} className={cn(outerCardStyles, className)} {...props}>
        {/* Container for inner card positioning and gap content */}
        <div className={cn('flex flex-col h-full', getInnerCardPosition())}>
          {/* Gap content area - appears before inner card for top variant */}
          {variant === 'top' && gapChildren && <div className={gapAreaStyles}>{gapChildren}</div>}

          {/* Gap content area - appears before inner card for middle variant (top half) */}
          {variant === 'middle' && gapChildren && (
            <div className={cn(gapAreaStyles, 'flex-1')}>{gapChildren}</div>
          )}

          {/* Inner Card */}
          <div className={innerCardStyles}>{innerChildren || children}</div>

          {/* Gap content area - appears after inner card for middle variant (bottom half) */}
          {variant === 'middle' && gapChildren && (
            <div className={cn(gapAreaStyles, 'flex-1')}>
              {/* Additional gap content can go here if needed */}
            </div>
          )}

          {/* Gap content area - appears after inner card for bottom variant */}
          {variant === 'bottom' && gapChildren && (
            <div className={gapAreaStyles}>{gapChildren}</div>
          )}
        </div>
      </div>
    );
  }
);

ContainerCard.displayName = 'ContainerCard';

// Additional utility components for better composition
const ContainerCardInner = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props} />
  )
);

ContainerCardInner.displayName = 'ContainerCardInner';

const ContainerCardGap = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-center text-muted-foreground', className)}
      {...props}
    />
  )
);

ContainerCardGap.displayName = 'ContainerCardGap';

export { ContainerCard, ContainerCardGap, ContainerCardInner };
