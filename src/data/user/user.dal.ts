import type { AuditAction, AuditActorRole, AuditEntityType } from '@/generated/enums';
import { auditServerAction } from '@/lib/audit/audit';
import { getEnhancedAuditContext } from '@/lib/audit/audit-context';
import { prisma } from '@/lib/db';
import { CompleteProfileSchema } from '@/lib/schemas/complete-profile-schema';

/**
 * Normalizes a userId by trimming, lowercasing, and converting to NFC
 */
export function normalizeUserId(userId: string): string {
  return userId.trim().toLowerCase().normalize('NFC');
}

/**
 * List of reserved userIds that cannot be used
 */
export const RESERVED_USER_IDS = [
  '',
  'admin',
  'administrator',
  'api',
  'app',
  'auth',
  'blog',
  'dashboard',
  'dev',
  'docs',
  'help',
  'home',
  'info',
  'italihub',
  'mail',
  'news',
  'public',
  'root',
  'support',
  'system',
  'telegram',
  'test',
  'user',
  'users',
  'www',
];

/**
 * Checks if a userId follows the basic format rules using CompleteProfileSchema validation
 */
export function isValidUserIdFormat(userId: string): boolean {
  if (!userId || typeof userId !== 'string') return false;

  // Use the Zod schema validation for consistency
  const userIdSchema = CompleteProfileSchema.shape.userId;
  const result = userIdSchema.safeParse(userId);

  return result.success;
}

/**
 * Checks if a userId is available for use
 * Returns an object indicating availability and reason if not available
 */
export async function isUserIdAvailable(
  userId: string,
  currentUserId?: string
): Promise<{ available: boolean; reason?: 'invalid' | 'reserved' | 'taken' }> {
  const normalized = normalizeUserId(userId);

  // If it's the same as current user's ID, it's available (for edit profile)
  if (currentUserId && normalizeUserId(currentUserId) === normalized) {
    return { available: true };
  }

  // Check format validity
  if (!isValidUserIdFormat(userId)) {
    return { available: false, reason: 'invalid' };
  }

  // Check reserved list
  if (RESERVED_USER_IDS.includes(normalized)) {
    return { available: false, reason: 'reserved' };
  }

  // Check database uniqueness
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        userId: {
          equals: normalized,
          mode: 'insensitive', // CITEXT comparison
        },
      },
      select: { id: true },
    });

    if (existingUser) {
      return { available: false, reason: 'taken' };
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking userId availability:', error);
    // On database error, assume not available for safety
    return { available: false, reason: 'taken' };
  }
}

/**
 * Checks if a username is available (legacy function name for backward compatibility)
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const result = await isUserIdAvailable(username);
  return result.available;
}

/**
 * Update user profile name
 */
export async function updateProfileName(
  userId: string,
  newName: string,
  metadata: { before: string; newValue: string }
): Promise<void> {
  const auditContext = await getEnhancedAuditContext();

  await auditServerAction(
    'PROFILE_NAME_EDIT',
    'USER' as AuditEntityType,
    async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: newName,
        },
      });

      return { success: true };
    },
    {
      actorUserId: userId,
      actorRole: 'USER' as AuditActorRole,
      ...auditContext,
    },
    undefined,
    'User updated profile name',
    metadata
  );
}

/**
 * Update user profile userId
 */
export async function updateProfileUserId(
  userId: string,
  newUserId: string,
  metadata: { before: string; newValue: string }
): Promise<void> {
  const auditContext = await getEnhancedAuditContext();

  await auditServerAction(
    'PROFILE_USERID_EDIT',
    'USER' as AuditEntityType,
    async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          userId: newUserId.toLowerCase(),
        },
      });

      return { success: true };
    },
    {
      actorUserId: userId,
      actorRole: 'USER' as AuditActorRole,
      ...auditContext,
    },
    undefined,
    'User updated profile userId',
    metadata
  );
}

/**
 * Update user profile telegram handle
 */
export async function updateProfileTelegram(
  userId: string,
  newTelegram: string,
  metadata: { before: string | null; newValue: string | null }
): Promise<void> {
  const auditContext = await getEnhancedAuditContext();

  await auditServerAction(
    'PROFILE_TELEGRAMID_EDIT',
    'USER' as AuditEntityType,
    async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          telegramHandle: newTelegram || null,
        },
      });

      return { success: true };
    },
    {
      actorUserId: userId,
      actorRole: 'USER' as AuditActorRole,
      ...auditContext,
    },
    undefined,
    'User updated profile telegram handle',
    metadata
  );
}

/**
 * Change user's city
 */
export async function changeCity(
  userId: string,
  newCityId: number
): Promise<{
  revokedVerification: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verified: true, cityLastChangedAt: true, cityId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check 10-day cooldown
  if (user.cityLastChangedAt) {
    const daysSinceChange = Math.floor(
      (Date.now() - user.cityLastChangedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceChange < 10) {
      throw new Error(`You can change your city again in ${10 - daysSinceChange} days`);
    }
  }

  const auditContext = await getEnhancedAuditContext();
  const wasVerified = user.verified;

  return await auditServerAction(
    'CITY_CHANGE' as AuditAction,
    'USER' as AuditEntityType,
    async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          cityId: newCityId,
          cityLastChangedAt: new Date(),
          verified: false,
          verifiedAt: null,
        },
      });

      return {
        revokedVerification: wasVerified,
      };
    },
    {
      actorUserId: userId,
      actorRole: 'USER' as AuditActorRole,
      ...auditContext,
    },
    undefined,
    'User changed city'
  );
}

/**
 * Update user's profile picture
 * This function handles the database operation for updating user image
 */
export async function updateUserProfilePicture(userId: string, imageKey: string): Promise<void> {
  const auditContext = await getEnhancedAuditContext();

  await auditServerAction(
    'PROFILE_PHOTO_CHANGE' as AuditAction,
    'USER' as AuditEntityType,
    async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          image: imageKey,
        },
      });

      return { success: true };
    },
    {
      actorUserId: userId,
      actorRole: 'USER' as AuditActorRole,
      ...auditContext,
    },
    undefined,
    'User updated profile picture'
  );
}

/**
 * Get user's current profile picture key
 * Used for cleanup operations
 */
export async function getUserProfilePicture(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  return user?.image || null;
}

/**
 * Delete user's profile picture
 */
export async function deleteUserProfilePicture(userId: string): Promise<void> {
  const auditContext = await getEnhancedAuditContext();

  await auditServerAction(
    'PROFILE_PHOTO_DELETE' as AuditAction,
    'USER' as AuditEntityType,
    async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          image: null,
        },
      });

      return { success: true };
    },
    {
      actorUserId: userId,
      actorRole: 'USER' as AuditActorRole,
      ...auditContext,
    },
    undefined,
    'User deleted profile picture'
  );
}
