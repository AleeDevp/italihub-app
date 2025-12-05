'use client';

import { AdCard } from '@/components/ad-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdWithDetails } from '@/data/ads/ads';
import type { AdCategory, AdStatus } from '@/generated/prisma';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface AdsListProps {
  activeTab: AdCategory;
  statusFilter: AdStatus | null;
  ads: AdWithDetails[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AdsList({ activeTab, statusFilter, ads, loading, error, onRetry }: AdsListProps) {
  // Filter ads by status
  const filteredAds = statusFilter ? ads.filter((ad) => ad.status === statusFilter) : ads;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 px-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 rounded-full bg-red-50 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-sm text-gray-600 text-center mb-4 max-w-md">{error}</p>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (filteredAds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 rounded-full bg-gray-50 mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No ads found</h3>
        <p className="text-sm text-gray-600 text-center max-w-md">
          {statusFilter
            ? `You don't have any ${statusFilter.toLowerCase()} ads in this category yet.`
            : `You haven't created any ads in this category yet.`}
        </p>
      </div>
    );
  }

  // Ads list
  return (
    <div className="space-y-4 px-2">
      {filteredAds.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
