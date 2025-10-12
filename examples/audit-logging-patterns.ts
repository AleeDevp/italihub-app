/**
 * Example: How to add audit logging to existing server actions
 *
 * This file demonstrates different patterns for integrating audit logging
 * into your Next.js server actions.
 */

import { auditServerAction, logAuditBatch, logFailure, logSuccess } from '@/lib/audit/audit';
import { getEnhancedAuditContext } from '@/lib/audit/audit-context';
import { requireUser } from '@/lib/auth/server';

// ============================================================================
// PATTERN 1: Wrapper Function (Recommended)
// ============================================================================

/**
 * Use auditServerAction wrapper for clean, automatic success/failure logging
 */
export async function updateUserProfileAction(userData: {
  name?: string;
  telegramHandle?: string;
}) {
  const user = await requireUser();

  return await auditServerAction(
    'PROFILE_EDIT', // Action from AuditAction enum
    'USER', // Entity type from AuditEntityType enum
    async () => {
      // Your existing business logic goes here
      const updatedUser = await updateUserProfile(user.id, userData);
      return { success: true, user: updatedUser };
    },
    {
      actorUserId: user.id,
      actorRole: 'USER', // or user.role if available
    },
    undefined, // entityId (optional)
    'User profile update action'
  );
}

// ============================================================================
// PATTERN 2: Manual Success/Failure Logging
// ============================================================================

/**
 * Manual logging gives you more control but requires more code
 */
export async function createAdAction(adData: any) {
  const user = await requireUser();
  const context = await getEnhancedAuditContext();

  try {
    // Your business logic
    const ad = await createAd(adData, user.id);

    // Manual success logging
    await logSuccess(
      'AD_CREATE',
      'AD',
      context,
      ad.id, // Now we have the entity ID
      {
        category: adData.category,
        title: adData.title?.substring(0, 100), // Truncate for safety
      },
      'Advertisement created successfully'
    );

    return { success: true, ad };
  } catch (error) {
    // Manual failure logging
    await logFailure(
      'AD_CREATE',
      'AD',
      error instanceof Error ? error.constructor.name : 'UNKNOWN_ERROR',
      context,
      undefined,
      {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        category: adData.category,
      },
      'Advertisement creation failed'
    );

    throw error; // Re-throw to maintain original behavior
  }
}

// ============================================================================
// PATTERN 3: Bulk Operations with Batch Logging
// ============================================================================

/**
 * For operations affecting multiple entities
 */
export async function bulkDeleteAdsAction(adIds: number[]) {
  const user = await requireUser();
  const context = await getEnhancedAuditContext();

  const results = await Promise.allSettled(adIds.map((id) => deleteAd(id, user.id)));

  // Prepare batch audit entries
  const auditEntries = results.map((result, index) => ({
    action: 'AD_DELETE' as const,
    outcome: result.status === 'fulfilled' ? ('SUCCESS' as const) : ('FAILURE' as const),
    entityType: 'AD' as const,
    entityId: adIds[index],
    errorCode: result.status === 'rejected' ? 'DELETE_FAILED' : undefined,
    ...context,
    metadata:
      result.status === 'rejected'
        ? {
            errorMessage: result.reason?.message || 'Delete failed',
          }
        : undefined,
  }));

  // Log all operations in batch
  await logAuditBatch(auditEntries);

  return {
    success: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
  };
}

// ============================================================================
// PATTERN 4: Admin Actions with Elevated Permissions
// ============================================================================

/**
 * Admin actions should specify the admin role and target user
 */
export async function adminBanUserAction(targetUserId: string, reason: string) {
  const admin = await requireUser(); // Verify admin permissions separately

  return await auditServerAction(
    'ROLE_REVOKE', // or create ADMIN_BAN_USER action
    'USER',
    async () => {
      await banUser(targetUserId, reason, admin.id);
      return { success: true };
    },
    {
      actorUserId: admin.id,
      actorRole: 'ADMIN', // Admin performing the action
    },
    parseInt(targetUserId), // Target user as entity ID
    `Admin banned user: ${reason}`
  );
}

// ============================================================================
// PATTERN 5: System/Background Operations
// ============================================================================

/**
 * For scheduled tasks or system operations
 */
export async function expireOldAdsTask() {
  const expiredAds = await findExpiredAds();

  const auditEntries = [];

  for (const ad of expiredAds) {
    try {
      await expireAd(ad.id);
      auditEntries.push({
        action: 'AD_EXPIRE' as const,
        outcome: 'SUCCESS' as const,
        entityType: 'AD' as const,
        entityId: ad.id,
        actorUserId: null, // System operation
        actorRole: 'SYSTEM' as const,
        metadata: {
          automaticExpiry: true,
          originalExpiryDate: ad.expiresAt,
        },
      });
    } catch (error) {
      auditEntries.push({
        action: 'AD_EXPIRE' as const,
        outcome: 'FAILURE' as const,
        entityType: 'AD' as const,
        entityId: ad.id,
        actorUserId: null,
        actorRole: 'SYSTEM' as const,
        errorCode: 'EXPIRE_FAILED',
        metadata: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  if (auditEntries.length > 0) {
    await logAuditBatch(auditEntries);
  }

  return { processed: auditEntries.length };
}

// ============================================================================
// PATTERN 6: File Upload Operations
// ============================================================================

/**
 * For operations involving file uploads
 */
export async function uploadProfilePictureAction(formData: FormData) {
  const user = await requireUser();

  return await auditServerAction(
    'PROFILE_PHOTO_CHANGE',
    'USER',
    async () => {
      const file = formData.get('profilePicture') as File;
      const uploadResult = await uploadProfilePicture(file, user.id);
      return uploadResult;
    },
    {
      actorUserId: user.id,
      actorRole: 'USER',
    },
    undefined,
    'Profile picture upload'
  );
}

// ============================================================================
// Dummy business logic functions (replace with your actual implementations)
// ============================================================================

async function updateUserProfile(userId: string, data: any) {
  // Your existing implementation
  return { id: userId, ...data };
}

async function createAd(adData: any, userId: string) {
  // Your existing implementation
  return { id: 123, ...adData, userId };
}

async function deleteAd(adId: number, userId: string) {
  // Your existing implementation
  return true;
}

async function banUser(userId: string, reason: string, adminId: string) {
  // Your existing implementation
  return true;
}

async function findExpiredAds(): Promise<Array<{ id: number; expiresAt: Date }>> {
  // Your existing implementation
  return [];
}

async function expireAd(adId: number) {
  // Your existing implementation
  return true;
}

async function uploadProfilePicture(file: File, userId: string) {
  // Your existing implementation
  return { url: 'https://example.com/image.jpg' };
}
