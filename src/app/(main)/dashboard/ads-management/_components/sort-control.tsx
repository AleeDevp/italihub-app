'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { SORT_OPTIONS, type SortOption } from '@/constants/ad-filters';
import { ArrowUpDown } from 'lucide-react';
import { memo } from 'react';

interface SortControlProps {
  sortOrder: SortOption;
  onSortChange: (order: SortOption) => void;
}

export const SortControl = memo(function SortControl({
  sortOrder,
  onSortChange,
}: SortControlProps) {
  return (
    <Select value={sortOrder} onValueChange={(value) => onSortChange(value as SortOption)}>
      <SelectTrigger
        aria-label="Sort ads"
        className="h-9 w-9 border-none bg-transparent p-0 text-muted-foreground shadow-none hover:text-foreground focus-visible:ring-0 focus-visible:outline-none [&>svg:last-child]:hidden"
      >
        <ArrowUpDown className="h-5 w-5" />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[13rem]">
        {SORT_OPTIONS.map(({ value, label, description }) => (
          <SelectItem key={value} value={value}>
            <div className="flex flex-col text-left">
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
