import type { AdWithDetails } from '@/data/ads/ads';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

interface UserAdsResponse {
  ads: AdWithDetails[];
}

/**
 * Custom hook to fetch and cache user's ads using React Query.
 *
 * Features:
 * - Caches data for 5 minutes (no refetch on mount if data is fresh)
 * - Persists in memory for 10 minutes even when component unmounts
 * - Prevents refetch on window focus (user navigating back from ad detail)
 * - Refetches on reconnection or manual invalidation
 *
 * @returns Query result with ads data, loading, and error states
 */
export function useUserAds(): UseQueryResult<AdWithDetails[], Error> {
  return useQuery<UserAdsResponse, Error, AdWithDetails[]>({
    queryKey: ['user-ads'],
    queryFn: async () => {
      const response = await fetch('/api/ads/user-ads');

      if (!response.ok) {
        throw new Error('Failed to fetch user ads');
      }

      const data = await response.json();
      return data;
    },
    select: (data) => data.ads ?? [],
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh, no refetch on mount
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists in memory (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when user comes back from ad detail page
    refetchOnMount: 'always', // Always refetch when component mounts (for cache invalidation)
    refetchOnReconnect: true, // Refetch if network was lost and restored
    retry: 2, // Retry failed requests up to 2 times
  });
}
