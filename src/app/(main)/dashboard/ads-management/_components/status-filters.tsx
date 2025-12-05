'use client';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STATUS_TABS } from '@/constants/ad-filters';
import type { AdStatus } from '@/generated/prisma';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface StatusFiltersProps {
  activeStatus: AdStatus | null;
  statusCounts: Record<AdStatus, number>;
  onStatusChange: (status: AdStatus) => void;
}

export const StatusFilters = memo(function StatusFilters({
  activeStatus,
  statusCounts,
  onStatusChange,
}: StatusFiltersProps) {
  // Find the first status with ads as fallback
  const firstAvailableStatus = STATUS_TABS.find(({ value }) => statusCounts[value] > 0)?.value;
  const statusValue = activeStatus ?? firstAvailableStatus ?? 'ONLINE';

  return (
    <Tabs
      value={statusValue}
      onValueChange={(value) => onStatusChange(value as AdStatus)}
      className="flex-1"
    >
      <TabsList className="inline-flex bg-gray-100 h-auto w-full items-center justify-start gap-1.5 overflow-x-auto rounded-2xl p-1.5 shadow-inner">
        {STATUS_TABS.map(({ value, label, icon: Icon, colorClasses }) => {
          const count = statusCounts[value] ?? 0;
          const isActive = statusValue === value;

          return (
            <TabsTrigger
              key={value}
              value={value}
              disabled={count === 0}
              className={cn(
                'h-auto gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all duration-150',
                'bg-gray-50 shadow-xs disabled:cursor-not-allowed disabled:opacity-40',
                colorClasses.active,
                colorClasses.inactive
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className={cn('hidden text-nowrap sm:inline', isActive && 'inline')}>
                {label}
              </span>
              {count > 0 && (
                <Badge
                  className={cn(
                    'h-auto rounded-full px-1.5 py-0 text-[9px] font-bold leading-tight',
                    isActive ? 'border-transparent bg-white/20 text-white' : colorClasses.badge
                  )}
                >
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
});
