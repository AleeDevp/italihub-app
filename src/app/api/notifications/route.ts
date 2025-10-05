import type { NotificationType } from '@/generated/prisma';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);

  const take = Math.min(parseInt(searchParams.get('take') || '30', 10), 50);
  const cursorId = searchParams.get('cursorId');
  const type = searchParams.get('type') as NotificationType | null;

  const where: any = { userId: user.id };
  if (type) where.type = type;

  const cursor = cursorId ? { id: Number(cursorId) } : undefined;

  const items = await prisma.notification.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    ...(cursor ? { cursor, skip: 1 } : {}),
  });

  const hasMore = items.length > take;
  const pageItems = hasMore ? items.slice(0, take) : items;
  const nextCursor = hasMore ? { cursorId: pageItems[pageItems.length - 1].id } : null;

  return Response.json({ items: pageItems, nextCursor, hasMore });
}
