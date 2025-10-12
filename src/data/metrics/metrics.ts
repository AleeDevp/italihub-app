import { prisma } from '@/lib/db';

export async function getOnlineAdsWithCounters(userId: string): Promise<
  Array<{
    adId: number;
    title?: string | null;
    views: number;
    clicks: number;
  }>
> {
  const ads = await prisma.ad.findMany({
    where: {
      userId,
      status: 'ONLINE',
    },
    include: {
      marketplace: { select: { title: true } },
      service: { select: { title: true } },
    },
    orderBy: { viewsCount: 'desc' },
    take: 10, // Top 10 ads
  });

  return ads.map((ad) => ({
    adId: ad.id,
    title: ad.marketplace?.title || ad.service?.title || null,
    views: ad.viewsCount,
    clicks: ad.contactClicksCount,
  }));
}
