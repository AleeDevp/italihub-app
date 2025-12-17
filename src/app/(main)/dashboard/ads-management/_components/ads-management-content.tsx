'use client';

import { Separator } from '@/components/ui/separator';
import type { SortOption } from '@/constants/ad-filters';
import { STATUS_ORDER } from '@/constants/ad-filters';
import type { AdCategory, AdStatus } from '@/generated/prisma';
import { useUserAds } from '@/hooks/use-user-ads';
import { calculateAdCounts, filterAndSortAds } from '@/lib/ad-management-utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdsList } from './ads-list';
import { AdsOverviewSidebar } from './ads-overview-sidebar';
import { CategoryTabs } from './category-tabs';
import { SortControl } from './sort-control';
import { StatusFilters } from './status-filters';

export function AdsManagementContent() {
  const [activeTab, setActiveTab] = useState<AdCategory>('HOUSING');
  const [activeStatus, setActiveStatus] = useState<AdStatus | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');

  // Use React Query hook for data fetching with automatic caching
  const { data: ads = [], isLoading: loading, error: queryError, refetch } = useUserAds();

  // Format error message
  const error = queryError
    ? 'Unable to load your ads right now. Please try again in a moment.'
    : null;

  // Calculate counts once with optimized function
  const { categoryCounts, statusCounts } = useMemo(
    () => calculateAdCounts(ads, activeTab),
    [ads, activeTab]
  );

  // Filter and sort ads efficiently
  const sortedCategoryAds = useMemo(
    () => filterAndSortAds(ads, activeTab, sortOrder),
    [ads, activeTab, sortOrder]
  );

  // Auto-select first available status when needed
  useEffect(() => {
    if (loading) return;

    const firstAvailableStatus = STATUS_ORDER.find((status) => statusCounts[status] > 0);

    if (activeStatus && statusCounts[activeStatus] === 0) {
      setActiveStatus(firstAvailableStatus ?? null);
    } else if (!activeStatus && firstAvailableStatus) {
      setActiveStatus(firstAvailableStatus);
    }
  }, [activeStatus, statusCounts, loading]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleCategoryChange = useCallback((category: AdCategory) => {
    setActiveTab(category);
  }, []);

  const handleStatusChange = useCallback((status: AdStatus) => {
    setActiveStatus(status);
  }, []);

  const handleSortChange = useCallback((order: SortOption) => {
    setSortOrder(order);
  }, []);

  return (
    <div className="space-y-5">
      <CategoryTabs
        activeTab={activeTab}
        categoryCounts={categoryCounts}
        onTabChange={handleCategoryChange}
      />

      <div className="mx-auto pb-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div className="py-4 md:px-4 bg-neutral-50 shadow-lg md:rounded-3xl w-full space-y-4 lg:mr-auto lg:max-w-[900px] lg:min-w-[600px] lg:flex-4">
            <div className="px-2">
              <div className="flex items-center gap-8">
                <StatusFilters
                  activeStatus={activeStatus}
                  statusCounts={statusCounts}
                  onStatusChange={handleStatusChange}
                />
                <SortControl sortOrder={sortOrder} onSortChange={handleSortChange} />
              </div>
            </div>
            <Separator className="" />

            <AdsList
              activeTab={activeTab}
              statusFilter={activeStatus}
              ads={sortedCategoryAds}
              loading={loading}
              error={error}
              onRetry={refetch}
            />
          </div>

          <div className="hidden lg:flex lg:flex-1">
            <AdsOverviewSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
