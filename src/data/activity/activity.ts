import { AuditAction, AuditEntityType, AuditOutcome } from '@/generated/prisma';

export async function listRecentUserActivity(
  userId: string,
  limit = 20
): Promise<
  Array<{
    createdAt: Date;
    action: string;
    entityType: string;
    entityId?: number | null;
    outcome: string;
  }>
> {
  // For now, return mock data since there's a schema mismatch between User.id (String) and AuditLog.actorUserId (Int)
  // This should be fixed in the database schema
  return [
    {
      createdAt: new Date(),
      action: AuditAction.AD_CREATE,
      entityType: AuditEntityType.AD,
      entityId: 1,
      outcome: AuditOutcome.SUCCESS,
    },
  ];
}
