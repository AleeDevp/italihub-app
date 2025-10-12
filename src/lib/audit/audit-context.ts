import { getServerSession } from '@/lib/auth/server';
import { headers } from 'next/headers';
import type { AuditContext } from './audit';

/**
 * Get current user session and audit context from better-auth
 */
export async function getAuditContextFromSession(): Promise<AuditContext> {
  try {
    const session = await getServerSession();

    return {
      actorUserId: session?.user?.id || null,
      actorRole: (session?.user?.role as any) || undefined,
      // Prefer a stable identifier if available on your session shape
      sessionId: (session as any)?.session?.id || (session as any)?.sessionId || undefined,
    };
  } catch (error) {
    console.error('Error getting audit context from session:', error);
    return {
      actorUserId: null,
      actorRole: undefined,
      sessionId: undefined,
    };
  }
}

/**
 * Get enhanced audit context combining session and request information
 */
export async function getEnhancedAuditContext(): Promise<AuditContext> {
  const sessionContext = await getAuditContextFromSession();

  try {
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') ||
      '127.0.0.1';
    const userAgent = headersList.get('user-agent') || undefined;
    const requestId = headersList.get('x-request-id') || undefined;

    return {
      ...sessionContext,
      ip: ip.split(',')[0]?.trim(), // Get first IP if multiple
      userAgent: userAgent?.substring(0, 512), // Truncate to fit DB constraint
      requestId: requestId?.substring(0, 64), // Truncate to fit DB constraint
    };
  } catch (error) {
    console.error('Error getting enhanced audit context:', error);
    return sessionContext;
  }
}
