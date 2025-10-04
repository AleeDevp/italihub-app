import type { AuditAction, AuditActorRole, AuditEntityType, AuditOutcome } from '@/generated/enums';
import { headers } from 'next/headers';
import { prisma } from './db';

// Types for audit logging
export interface AuditContext {
  actorUserId?: string | null;
  actorRole?: AuditActorRole;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  // WHO
  actorUserId?: string | null;
  actorRole?: AuditActorRole;

  // WHAT
  action: AuditAction;
  outcome: AuditOutcome;
  errorCode?: string;

  // WHICH RESOURCE
  entityType: AuditEntityType;
  entityId?: number;

  // CONTEXT
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;

  // DETAILS
  metadata?: Record<string, any>;
  note?: string;
}

export interface AuthActionMetadata {
  email?: string;
  provider?: string;
  emailVerified?: boolean;
  accountLinked?: boolean;
  failureReason?: string;
  userAgent?: string;
  // Add any other relevant auth-specific metadata
}

// Utility functions to extract context from request
export async function getRequestContext(): Promise<Partial<AuditContext>> {
  try {
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') ||
      '127.0.0.1';
    const userAgent = headersList.get('user-agent') || undefined;

    // Generate or extract request ID (you can use a UUID library or custom logic)
    const requestId =
      headersList.get('x-request-id') || headersList.get('x-correlation-id') || generateRequestId();

    return {
      ip: ip.split(',')[0]?.trim(), // Get first IP if multiple
      userAgent: userAgent?.substring(0, 512), // Truncate to fit DB constraint
      requestId: requestId.substring(0, 64), // Truncate to fit DB constraint
    };
  } catch (error) {
    console.error('Error getting request context:', error);
    return {};
  }
}

// Generate a simple request ID (you might want to use a proper UUID library)
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Core audit logging function
async function logAuditInternal(entry: AuditLogEntry): Promise<void> {
  try {
    // Sanitize metadata to remove any sensitive information
    const sanitizedMetadata = entry.metadata ? sanitizeMetadata(entry.metadata) : undefined;

    await prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        actorRole: entry.actorRole,
        action: entry.action,
        outcome: entry.outcome,
        errorCode: entry.errorCode?.substring(0, 64),
        entityType: entry.entityType,
        entityId: entry.entityId,
        requestId: entry.requestId?.substring(0, 64),
        sessionId: entry.sessionId?.substring(0, 64),
        ip: entry.ip?.substring(0, 45),
        userAgent: entry.userAgent?.substring(0, 512),
        metadata: sanitizedMetadata,
        note: entry.note,
      },
    });
  } catch (error) {
    // Log audit failures to console but don't throw to avoid breaking main functionality
    console.error('Failed to write audit log:', error);
    console.error('Audit entry was:', JSON.stringify(entry, null, 2));
  }
}

// Sanitize metadata to remove sensitive information
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'credential',
    'auth',
    'session',
    'cookie',
    'authorization',
    'ssn',
    'social_security',
    'passport',
    'credit_card',
    'api_key',
    'private_key',
    'access_token',
    'refresh_token',
  ];

  const sanitized = { ...metadata };

  function sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      // Check if string looks like sensitive data
      if (sensitiveKeys.some((key) => obj.toLowerCase().includes(key))) {
        return '[REDACTED]';
      }
      return obj;
    }

    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item));
      }

      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitizeObject(value);
        }
      }
      return result;
    }

    return obj;
  }

  return sanitizeObject(sanitized);
}

// Convenience function for successful audit logs
async function logSuccessInternal(
  action: AuditAction,
  entityType: AuditEntityType,
  context: Partial<AuditContext> = {},
  entityId?: number,
  metadata?: Record<string, any>,
  note?: string
): Promise<void> {
  const requestContext = await getRequestContext();

  await logAuditInternal({
    action,
    outcome: 'SUCCESS' as AuditOutcome,
    entityType,
    entityId,
    metadata,
    note,
    ...context,
    ...requestContext,
  });
}

// Convenience function for failed audit logs
async function logFailureInternal(
  action: AuditAction,
  entityType: AuditEntityType,
  errorCode: string,
  context: Partial<AuditContext> = {},
  entityId?: number,
  metadata?: Record<string, any>,
  note?: string
): Promise<void> {
  const requestContext = await getRequestContext();

  await logAuditInternal({
    action,
    outcome: 'FAILURE' as AuditOutcome,
    errorCode,
    entityType,
    entityId,
    metadata,
    note,
    ...context,
    ...requestContext,
  });
}

// Auth-specific logging functions
export class AuthAuditor {
  // Log successful registration
  static async logRegistrationSuccess(
    email: string,
    userId: string,
    metadata: Partial<AuthActionMetadata> = {}
  ): Promise<void> {
    await logSuccessInternal(
      'REGISTER' as AuditAction,
      'USER' as AuditEntityType,
      {
        actorUserId: userId,
        actorRole: 'USER' as AuditActorRole,
      },
      undefined, // entityId not needed for user registration
      {
        email,
        ...metadata,
      },
      'User registration successful'
    );
  }

  // Log failed registration
  static async logRegistrationFailure(
    email: string,
    errorCode: string,
    metadata: Partial<AuthActionMetadata> = {}
  ): Promise<void> {
    await logFailureInternal(
      'REGISTER' as AuditAction,
      'USER' as AuditEntityType,
      errorCode,
      {
        actorUserId: null,
        actorRole: undefined,
      },
      undefined,
      {
        email,
        ...metadata,
      },
      'User registration failed'
    );
  }

  // Log successful login
  static async logLoginSuccess(
    userId: string,
    sessionId: string,
    metadata: Partial<AuthActionMetadata> = {}
  ): Promise<void> {
    await logSuccessInternal(
      'LOGIN' as AuditAction,
      'USER' as AuditEntityType,
      {
        actorUserId: userId,
        actorRole: 'USER' as AuditActorRole,
        sessionId,
      },
      undefined,
      metadata,
      'User login successful'
    );
  }

  // Log failed login
  static async logLoginFailure(
    email: string,
    errorCode: string,
    metadata: Partial<AuthActionMetadata> = {}
  ): Promise<void> {
    await logFailureInternal(
      'LOGIN' as AuditAction,
      'USER' as AuditEntityType,
      errorCode,
      {
        actorUserId: null,
        actorRole: undefined,
      },
      undefined,
      {
        email,
        ...metadata,
      },
      'User login failed'
    );
  }

  // Log successful logout
  static async logLogoutSuccess(
    userId: string,
    sessionId?: string,
    metadata: Partial<AuthActionMetadata> = {}
  ): Promise<void> {
    await logSuccessInternal(
      'LOGOUT' as AuditAction,
      'USER' as AuditEntityType,
      {
        actorUserId: userId,
        actorRole: 'USER' as AuditActorRole,
        sessionId,
      },
      undefined,
      metadata,
      'User logout successful'
    );
  }

  // Log OAuth actions
  static async logOAuthSuccess(
    action:
      | 'OAUTH_LINK_GOOGLE'
      | 'OAUTH_UNLINK_GOOGLE'
      | 'OAUTH_LINK_FACEBOOK'
      | 'OAUTH_UNLINK_FACEBOOK',
    userId: string,
    provider: string,
    metadata: Partial<AuthActionMetadata> = {}
  ): Promise<void> {
    await logSuccessInternal(
      action as AuditAction,
      'USER' as AuditEntityType,
      {
        actorUserId: userId,
        actorRole: 'USER' as AuditActorRole,
      },
      undefined,
      {
        provider,
        ...metadata,
      },
      `OAuth ${action.toLowerCase()} successful`
    );
  }

  static async logOAuthFailure(
    action:
      | 'OAUTH_LINK_GOOGLE'
      | 'OAUTH_UNLINK_GOOGLE'
      | 'OAUTH_LINK_FACEBOOK'
      | 'OAUTH_UNLINK_FACEBOOK',
    userId: string | null,
    provider: string,
    errorCode: string,
    metadata: Partial<AuthActionMetadata> = {}
  ): Promise<void> {
    await logFailureInternal(
      action as AuditAction,
      'USER' as AuditEntityType,
      errorCode,
      {
        actorUserId: userId,
        actorRole: userId ? ('USER' as AuditActorRole) : undefined,
      },
      undefined,
      {
        provider,
        ...metadata,
      },
      `OAuth ${action.toLowerCase()} failed`
    );
  }

  // Log password reset actions
  static async logPasswordResetRequest(
    email: string,
    userId?: string,
    metadata: Partial<AuthActionMetadata> = {}
  ): Promise<void> {
    await logSuccessInternal(
      'PASSWORD_RESET_REQUEST' as AuditAction,
      'USER' as AuditEntityType,
      {
        actorUserId: userId || null,
        actorRole: userId ? ('USER' as AuditActorRole) : undefined,
      },
      undefined,
      {
        email,
        ...metadata,
      },
      'Password reset requested'
    );
  }

  static async logPasswordResetConfirm(
    userId: string,
    metadata: Partial<AuthActionMetadata> = {}
  ): Promise<void> {
    await logSuccessInternal(
      'PASSWORD_RESET_CONFIRM' as AuditAction,
      'USER' as AuditEntityType,
      {
        actorUserId: userId,
        actorRole: 'USER' as AuditActorRole,
      },
      undefined,
      metadata,
      'Password reset confirmed'
    );
  }
}

// General mutation auditing for server actions
async function auditServerActionInternal<T>(
  action: AuditAction,
  entityType: AuditEntityType,
  operation: () => Promise<T>,
  context: Partial<AuditContext> = {},
  entityId?: number,
  note?: string,
  metadata?: Record<string, any>
): Promise<T> {
  try {
    const result = await operation();

    await logSuccessInternal(
      action,
      entityType,
      context,
      entityId,
      metadata,
      note || `${action} completed successfully`
    );

    return result;
  } catch (error) {
    const errorCode = error instanceof Error ? error.constructor.name : 'UNKNOWN_ERROR';

    const errorMetadata = {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    };

    await logFailureInternal(
      action,
      entityType,
      errorCode,
      context,
      entityId,
      errorMetadata,
      note || `${action} failed`
    );

    throw error; // Re-throw to maintain original behavior
  }
}

// Batch audit logging for performance
async function logAuditBatchInternal(entries: AuditLogEntry[]): Promise<void> {
  if (entries.length === 0) return;

  try {
    const sanitizedEntries = entries.map((entry) => ({
      actorUserId: entry.actorUserId,
      actorRole: entry.actorRole,
      action: entry.action,
      outcome: entry.outcome,
      errorCode: entry.errorCode?.substring(0, 64),
      entityType: entry.entityType,
      entityId: entry.entityId,
      requestId: entry.requestId?.substring(0, 64),
      sessionId: entry.sessionId?.substring(0, 64),
      ip: entry.ip?.substring(0, 45),
      userAgent: entry.userAgent?.substring(0, 512),
      metadata: entry.metadata ? sanitizeMetadata(entry.metadata) : undefined,
      note: entry.note,
    }));

    await prisma.auditLog.createMany({
      data: sanitizedEntries,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error('Failed to write audit log batch:', error);
    console.error('Audit entries were:', JSON.stringify(entries, null, 2));
  }
}

// Export main audit functions
export const logAudit = logAuditInternal;
export const logSuccess = logSuccessInternal;
export const logFailure = logFailureInternal;
export const auditServerAction = auditServerActionInternal;
export const logAuditBatch = logAuditBatchInternal;
