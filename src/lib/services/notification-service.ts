import type { NotificationSeverity, NotificationType } from '@/generated/prisma';
import { logSuccess } from '@/lib/audit/audit';
import { prisma } from '@/lib/db';
import { notificationBroker } from '@/lib/sse/notification-broker';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  body: string;
  deepLink?: string | null;
  adId?: number | null;
  verificationId?: number | null;
  reportId?: number | null;
  data?: Record<string, any> | null;
}

export async function createNotification(input: CreateNotificationInput) {
  const notif = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      severity: input.severity ?? 'INFO',
      title: input.title.substring(0, 140),
      body: input.body.substring(0, 1000),
      deepLink: input.deepLink?.substring(0, 255) ?? null,
      adId: input.adId ?? null,
      verificationId: input.verificationId ?? null,
      reportId: input.reportId ?? null,
      data: input.data ?? undefined,
    },
  });

  // Publish to SSE for this user
  notificationBroker.publish(input.userId, 'notification', serializeNotification(notif));

  await logSuccess('NOTIFICATION_CREATE', 'NOTIFICATION', { actorUserId: input.userId }, notif.id);

  return notif;
}

export function serializeNotification(n: any) {
  return {
    id: n.id,
    type: n.type,
    severity: n.severity,
    title: n.title,
    body: n.body,
    deepLink: n.deepLink,
    adId: n.adId,
    verificationId: n.verificationId,
    reportId: n.reportId,
    createdAt: n.createdAt,
    readAt: n.readAt,
    data: n.data ?? null,
  };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationsAsRead(userId: string, ids: number[]) {
  if (ids.length === 0) return { count: 0 };
  const res = await prisma.notification.updateMany({
    where: { userId, id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  });
  await logSuccess('NOTIFICATION_MARK_READ', 'NOTIFICATION', { actorUserId: userId });
  return { count: res.count };
}
