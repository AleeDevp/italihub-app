import { prisma } from '@/lib/db';

export async function listActiveAnnouncementsForUser(userId: string): Promise<
  Array<{
    id: number;
    title: string;
    body: string;
    severity: string;
    deepLink?: string | null;
    dismissible: boolean;
    pinned: boolean;
  }>
> {
  const now = new Date();

  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      // Exclude dismissed announcements if dismissible
      NOT: {
        reads: {
          some: { userId },
        },
      },
    },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      body: true,
      severity: true,
      deepLink: true,
      dismissible: true,
      pinned: true,
    },
  });

  return announcements;
}

export async function dismissAnnouncement(userId: string, announcementId: number): Promise<void> {
  await prisma.announcementRead.create({
    data: {
      userId,
      announcementId,
    },
  });
}
