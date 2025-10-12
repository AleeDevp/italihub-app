import type { AuditAction, AuditActorRole, AuditEntityType, UserRole } from '@/generated/enums';
import { auditServerAction } from '@/lib/audit/audit';
import { getEnhancedAuditContext } from '@/lib/audit/audit-context';
import { prisma } from '@/lib/db';

/**
 * Assign role to user (admin action)
 */
export async function assignUserRole(
  targetUserId: string,
  newRole: UserRole,
  adminUserId: string,
  adminRole: AuditActorRole = 'ADMIN'
): Promise<void> {
  const auditContext = await getEnhancedAuditContext();

  await auditServerAction(
    'ROLE_ASSIGN' as AuditAction,
    'USER' as AuditEntityType,
    async () => {
      const currentUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          role: newRole,
        },
      });

      return {
        previousRole: currentUser.role,
        newRole,
      };
    },
    {
      actorUserId: adminUserId,
      actorRole: adminRole,
      ...auditContext,
    },
    parseInt(targetUserId), // Target user as entity
    `Admin assigned role ${newRole} to user`
  );
}

/**
 * Revoke role from user (admin action)
 */
export async function revokeUserRole(
  targetUserId: string,
  adminUserId: string,
  adminRole: AuditActorRole = 'ADMIN'
): Promise<void> {
  const auditContext = await getEnhancedAuditContext();

  await auditServerAction(
    'ROLE_REVOKE' as AuditAction,
    'USER' as AuditEntityType,
    async () => {
      const currentUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          role: 'USER' as UserRole, // Default role
        },
      });

      return {
        previousRole: currentUser.role,
        newRole: 'USER',
      };
    },
    {
      actorUserId: adminUserId,
      actorRole: adminRole,
      ...auditContext,
    },
    parseInt(targetUserId), // Target user as entity
    'Admin revoked user role'
  );
}
