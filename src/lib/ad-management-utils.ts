import type { AdWithDetails } from '@/data/ads/ads';
import type { AdCategory, AdStatus } from '@/generated/prisma';

export type AdManagementFilters = {
  activeCategory: AdCategory;
  activeStatus: AdStatus | null;
  sortOrder: 'newest' | 'oldest';
};

export type AdCounts = {
  categoryCounts: Record<AdCategory, number>;
  statusCounts: Record<AdStatus, number>;
  totalAds: number;
};

/**
 * Calculate category and status counts from ads
 */
export function calculateAdCounts(ads: AdWithDetails[], activeCategory: AdCategory): AdCounts {
  const categoryCounts: Record<AdCategory, number> = {
    HOUSING: 0,
    TRANSPORTATION: 0,
    MARKETPLACE: 0,
    CURRENCY: 0,
    SERVICES: 0,
  };

  const statusCounts: Record<AdStatus, number> = {
    PENDING: 0,
    ONLINE: 0,
    REJECTED: 0,
    EXPIRED: 0,
  };

  ads.forEach((ad) => {
    categoryCounts[ad.category] = (categoryCounts[ad.category] || 0) + 1;

    if (ad.category === activeCategory) {
      statusCounts[ad.status] = (statusCounts[ad.status] || 0) + 1;
    }
  });

  const totalAds = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  return { categoryCounts, statusCounts, totalAds };
}

/**
 * Filter and sort ads by category and sort order
 */
export function filterAndSortAds(
  ads: AdWithDetails[],
  category: AdCategory,
  sortOrder: 'newest' | 'oldest'
): AdWithDetails[] {
  const filtered = ads.filter((ad) => ad.category === category);

  return filtered.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
  });
}
