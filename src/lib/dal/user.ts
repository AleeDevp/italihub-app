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
