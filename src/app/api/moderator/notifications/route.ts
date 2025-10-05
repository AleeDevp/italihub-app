import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/services/notification-service';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const actor = await requireUser();
  if (actor.role !== 'MODERATOR' && actor.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

  const {
    userId,
    email,
    type,
    severity = 'INFO',
    title,
    message,
    deepLink,
  } = body as Record<string, any>;

  if (!type || !title || !message) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields (type, title, message)' }),
      { status: 400 }
    );
  }

  let targetUserId: string | null = null;
  if (userId && typeof userId === 'string') {
    targetUserId = userId;
  } else if (email && typeof email === 'string') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return new Response(JSON.stringify({ error: 'User with this email not found' }), {
        status: 404,
      });
    targetUserId = user.id;
  } else {
    return new Response(JSON.stringify({ error: 'Provide userId or email' }), { status: 400 });
  }

  // Basic enum validation (runtime):
  const validTypes = new Set([
    'AD_EVENT',
    'VERIFICATION_EVENT',
    'REPORT_EVENT',
    'SYSTEM_ANNOUNCEMENT',
  ]);
  const validSeverities = new Set(['INFO', 'SUCCESS', 'WARNING', 'ERROR']);
  if (!validTypes.has(String(type)))
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  if (!validSeverities.has(String(severity)))
    return new Response(JSON.stringify({ error: 'Invalid severity' }), { status: 400 });

  const notif = await createNotification({
    userId: targetUserId,
    type,
    severity,
    title: String(title),
    body: String(message),
    deepLink: deepLink ? String(deepLink) : null,
  } as any);

  return Response.json({ ok: true, notification: notif });
}
