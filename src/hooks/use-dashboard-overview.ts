import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export type OverviewStats = {
  online: number;
  pending: number;
  rejected: number;
  expired: number;
};

export type TopAd = {
  adId: number;
  title?: string | null;
  views: number;
  clicks: number;
};

export type RecentActivity = {
  createdAt: Date;
  action: string;
  entityType: string;
  entityId?: number | null;
  outcome: string;
};

export type DashboardOverview = {
  stats: OverviewStats;
  topAds: TopAd[];
  recentActivity: RecentActivity[];
};

type OverviewApiResponse = {
  stats: OverviewStats;
  topAds: TopAd[];
  recentActivity: Array<{
    createdAt: string;
    action: string;
    entityType: string;
    entityId?: number | null;
    outcome: string;
  }>;
};

/**
 * Custom hook to fetch dashboard overview data using React Query.
 *
 * Features:
 * - Caches data for 2 minutes
 * - Refetches on window focus (dashboard stats should be fresh)
 * - Automatic error handling
 */
export function useDashboardOverview(): UseQueryResult<DashboardOverview, Error> {
  return useQuery<OverviewApiResponse, Error, DashboardOverview>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/overview', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Unable to load overview data.');
      }

      return response.json();
    },
    select: (data) => ({
      stats: data.stats,
      topAds: data.topAds,
      recentActivity: data.recentActivity.map((activity) => ({
        ...activity,
        createdAt: new Date(activity.createdAt),
      })),
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Dashboard stats should refresh when user returns
    refetchOnMount: true,
    retry: 2,
  });
}
