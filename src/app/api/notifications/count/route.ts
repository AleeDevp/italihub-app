import { requireUser } from '@/lib/auth/server';
import { getUnreadCount } from '@/lib/services/notification-service';

export async function GET() {
  const user = await requireUser();
  const count = await getUnreadCount(user.id);
  return Response.json({ count });
}
