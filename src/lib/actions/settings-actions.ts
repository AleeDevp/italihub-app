'use server';

import type { AuditAction, AuditActorRole, AuditEntityType } from '@/generated/enums';
import { AuthAuditor, logSuccess } from '@/lib/audit/audit';
import { authError, authErrorFrom, authSuccess, type AuthResult } from '@/lib/auth/auth-errors';
import { auth, requireUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db';
import { passwordChangeSchema } from '@/lib/schemas/auth_validation';
import { headers } from 'next/headers';

type ActionResponse = AuthResult & {
  fieldErrors?: Record<string, string[] | undefined>;
};

/**
 * Revoke a specific session for the current user
 */
export async function revokeSessionAction(sessionId: string): Promise<ActionResponse> {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) {
      return authError('Not authenticated', { code: 'NOT_AUTHENTICATED', status: 401 });
    }

    const currentSessionId = (session as any)?.session?.id || (session as any)?.sessionId;
    if (currentSessionId === sessionId) {
      return authError('Cannot revoke your current session', { code: 'CURRENT_SESSION' });
    }

    const target = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!target || target.userId !== session.user.id) {
      return authError('Session not found', { code: 'SESSION_NOT_FOUND', status: 404 });
    }

    await prisma.session.delete({ where: { id: sessionId } });

    await AuthAuditor.logLogoutSuccess(session.user.id, sessionId, { provider: 'session' });

    return authSuccess();
  } catch (error) {
    return authErrorFrom(error, 'Failed to revoke session');
  }
}

/**
 * Change the current user's password
 */
export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResponse> {
  try {
    const parse = passwordChangeSchema.safeParse(input);
    if (!parse.success) {
      const validationError = authError(parse.error.issues[0]?.message || 'Invalid input', {
        code: 'VALIDATION_ERROR',
        status: 400,
      });
      return {
        ...validationError,
        fieldErrors: parse.error.flatten().fieldErrors,
      };
    }

    const user = await requireUser();
    const requestHeaders = await headers();

    if (typeof (auth.api as any).changePassword === 'function') {
      await (auth.api as any).changePassword({
        body: {
          currentPassword: parse.data.currentPassword,
          newPassword: parse.data.newPassword,
        },
        headers: requestHeaders,
      });
    } else {
      return authError('Password change is not supported on this server.', {
        code: 'PASSWORD_CHANGE_UNSUPPORTED',
      });
    }

    await logSuccess(
      'PASSWORD_CHANGE' as AuditAction,
      'USER' as AuditEntityType,
      { actorUserId: user.id, actorRole: 'USER' as AuditActorRole },
      undefined,
      undefined,
      'User changed password'
    );

    return authSuccess();
  } catch (error) {
    return authErrorFrom(error, 'Failed to change password');
  }
}
