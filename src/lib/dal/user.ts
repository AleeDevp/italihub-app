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
 * Update user profile basics
 */
export async function updateProfileBasics(
  userId: string,
  data: {
    name: string;
    userId: string;
    telegram: string;
  }
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      userId: data.userId.toLowerCase(),
      telegramHandle: data.telegram || null,
    },
  });
}

/**
 * Get extended user profile data with city information
 */
export async function getUserProfileData(userId: string): Promise<{
  name: string;
  userId: string;
  telegramHandle: string;
  cityId: number;
  cityName: string;
  profilePhotoKey?: string | null;
  verified: boolean;
  verifiedAt?: Date | null;
  cityLastChangedAt?: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      city: { select: { name: true } },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    name: user.name,
    userId: user.userId || '',
    telegramHandle: user.telegramHandle || '',
    cityId: user.cityId || 0,
    cityName: user.city?.name || '',
    profilePhotoKey: user.image,
    verified: user.verified,
    verifiedAt: user.verifiedAt,
    cityLastChangedAt: user.cityLastChangedAt,
  };
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
    select: { verified: true, cityLastChangedAt: true },
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

  const wasVerified = user.verified;

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
}
