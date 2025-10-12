import { cn } from '@/lib/utils';
import type { ElementType } from 'react';

type PageLableVariant = 'horizontal' | 'vertical';

interface PageLableProps {
  icon: ElementType;
  title: string;
  description: string;
  variant?: PageLableVariant;
  className?: string;
}

export function PageLabel({
  icon,
  title,
  description,
  variant = 'horizontal',
  className,
}: PageLableProps) {
  const Icon = icon;
  const isVertical = variant === 'vertical';

  return (
    <div
      className={cn(
        className,
        isVertical
          ? 'flex flex-col items-center justify-center  gap-5'
          : ' flex items-center my-8 gap-5'
      )}
    >
      <div className="bg-neutral-100 inset-shadow-sm text-primary flex h-14 w-14 items-center justify-center rounded-full shrink-0">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <div
        className={isVertical ? 'space-y-1 leading-tight text-center' : 'space-y-1 leading-tight'}
      >
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
