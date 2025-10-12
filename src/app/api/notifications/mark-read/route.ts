import { requireUser } from '@/lib/auth/server';
import { markNotificationsAsRead } from '@/lib/services/notification-service';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'number')) {
    return new Response(JSON.stringify({ error: 'Invalid ids' }), { status: 400 });
  }
  if (ids.length > 100) {
    return new Response(JSON.stringify({ error: 'Too many ids' }), { status: 400 });
  }
  const { count } = await markNotificationsAsRead(user.id, ids as number[]);
  return Response.json({ updated: count });
}
