'use client';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AD_CATEGORY_CONFIG } from '@/constants/ad-categories';
import type { AdCategory } from '@/generated/prisma';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface CategoryTabsProps {
  activeTab: AdCategory;
  categoryCounts: Record<AdCategory, number>;
  onTabChange: (category: AdCategory) => void;
}

export const CategoryTabs = memo(function CategoryTabs({
  activeTab,
  categoryCounts,
  onTabChange,
}: CategoryTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as AdCategory)}>
      <div className="w-full px-1 md:px-0 overflow-none">
        <TabsList className="inline-flex p-1 gap-2 w-auto min-w-full md:grid md:grid-cols-4 h-auto rounded-2xl bg-white inset-shadow-sm shadow-md">
          {AD_CATEGORY_CONFIG.slice(0, 4).map((categoryMeta) => {
            const isActive = activeTab === categoryMeta.id;
            const count = categoryCounts[categoryMeta.id] ?? 0;
            const Icon = categoryMeta.icon;

            return (
              <TabsTrigger
                key={categoryMeta.id}
                value={categoryMeta.id}
                className={cn(
                  'relative flex flex-col md:flex-row items-center gap-0 md:gap-2 px-3 py-2 md:px-4',
                  isActive ? categoryMeta.bgSecondaryColor : '',
                  isActive ? '' : 'hover:bg-slate-100'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-[11px] sm:text-sm md:text-sm leading-tight">
                  {categoryMeta.name}
                </span>
                {count > 0 && (
                  <Badge
                    className={cn(
                      'absolute right-1 top-1 sm:top-1/2 sm:-translate-y-1/2 inline-flex rounded-full text-[8px] sm:text-[10px] font-semibold leading-tight',
                      isActive ? 'border-transparent bg-white/20' : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </Tabs>
  );
});
