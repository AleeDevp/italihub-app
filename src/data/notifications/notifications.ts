import { prisma } from '@/lib/db';

export async function getUnreadCount(userId: string): Promise<number> {
  const count = await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });

  return count;
}

export async function listNotifications(
  userId: string,
  p?: { page?: number; pageSize?: number }
): Promise<{
  items: Array<{
    id: number;
    createdAt: Date;
    title: string;
    body: string;
    type: string;
    severity: string;
    readAt?: Date | null;
    deepLink?: string | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
}> {
  const { page = 1, pageSize = 20 } = p || {};
  const offset = (page - 1) * pageSize;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        title: true,
        body: true,
        type: true,
        severity: true,
        readAt: true,
        deepLink: true,
      },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    items: notifications,
    total,
    page,
    pageSize,
  };
}

export async function markRead(userId: string, id: number): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
