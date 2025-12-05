import { listRecentUserActivity } from '@/data/activity/activity';
import { getUserAdStats } from '@/data/ads/ads';
import { getOnlineAdsWithCounters } from '@/data/metrics/metrics';

export type OverviewSnapshot = {
  adStats: {
    online: number;
    pending: number;
    rejected: number;
    expired: number;
  };
  topAds: Awaited<ReturnType<typeof getOnlineAdsWithCounters>>;
  recentActivity: Awaited<ReturnType<typeof listRecentUserActivity>>;
};

export async function getOverviewSnapshot(userId: string): Promise<OverviewSnapshot> {
  const [adStats, topAds, recentActivity] = await Promise.all([
    getUserAdStats(userId),
    getOnlineAdsWithCounters(userId),
    listRecentUserActivity(userId, 10),
  ]);

  return {
    adStats,
    topAds,
    recentActivity,
  };
}
