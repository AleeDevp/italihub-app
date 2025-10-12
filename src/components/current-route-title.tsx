'use client';

import { ROUTE_DEFINITIONS } from '@/config/routes';
import { useRouteInfo } from '@/hooks/use-route-info';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

export function CurrentRouteTitle({
  size = 16,
  className = '',
}: {
  size?: number;
  className?: string;
  titleClassName?: string;
}) {
  const { title } = useRouteInfo();
  const { key } = useRouteInfo();
  const route = ROUTE_DEFINITIONS.find((r) => r.key === key);
  const Icon = route?.icon || Circle;

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-muted-foreground text-sm font-medium ',
        className
      )}
    >
      <Icon size={size} aria-hidden />
      <span>{title}</span>
    </div>
  );
}

export default CurrentRouteTitle;

// No additional icon imports here; Circle is the only local fallback
