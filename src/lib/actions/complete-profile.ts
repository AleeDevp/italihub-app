'use server';

import type { AuditAction, AuditActorRole, AuditEntityType } from '@/generated/enums';
import { auditServerAction } from '@/lib/audit';
import { getEnhancedAuditContext } from '@/lib/audit-context';
import { requireUser } from '@/lib/auth';
import { isUserIdAvailable } from '@/lib/dal/user';
import { prisma } from '@/lib/db';
import { AvatarService } from '@/lib/image-utils-server';
import { CompleteProfileSchema } from '@/lib/schemas/complete-profile-schema';
import { z } from 'zod';

// Contract
// Inputs: values matching CompleteProfileSchema + optional File (profilePic)
// Output: { ok: true, data: { userId } } | { ok: false, error: string }

const ActionInput = CompleteProfileSchema.extend({
  // profilePic already nullable any in schema; keep type at runtime via FormData/File check
});

export type CompleteProfileInput = z.infer<typeof ActionInput>;

export type CompleteProfileResult =
  | { ok: true; data: { id: string } }
  | { ok: false; error: string };

export async function completeProfileAction(formData: FormData): Promise<CompleteProfileResult> {
  try {
    const user = await requireUser();

    // Extract values from FormData
    const raw = {
      name: formData.get('name') as string,
      userId: formData.get('userId') as string,
      city: formData.get('city') as string,
      confirmed: formData.get('confirmed') === 'true' || formData.get('confirmed') === 'on',
      telegram: (formData.get('telegram') as string) || '',
      // profilePic is a File or null
      profilePic: (formData.get('profilePic') as unknown as File) ?? null,
    };

    // Validate with Zod
    const parsed = ActionInput.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? 'Validation failed';
      return { ok: false, error: msg };
    }
    const values = parsed.data;

    // Final server-side userId availability check (prevent race conditions)
    const availabilityCheck = await isUserIdAvailable(values.userId, user.userId || undefined);
    if (!availabilityCheck.available) {
      let errorMsg = 'User ID is not available.';
      switch (availabilityCheck.reason) {
        case 'invalid':
          errorMsg = 'Invalid User ID format.';
          break;
        case 'reserved':
          errorMsg = 'This User ID is reserved and cannot be used.';
          break;
        case 'taken':
          errorMsg = 'This User ID is already taken.';
          break;
      }
      return { ok: false, error: errorMsg };
    }

    // Resolve cityId from city name (ensure exists)
    const city = await prisma.city.findFirst({ where: { name: values.city } });
    if (!city) {
      return { ok: false, error: 'Selected city is not valid.' };
    }

    // Optional image upload first (so we can include its key when updating)
    let newImageKey: string | null = null;
    if (values.profilePic && typeof (values.profilePic as any).arrayBuffer === 'function') {
      // Use new AvatarService for upload - this handles validation, upload, and returns proper result
      const uploadResult = await AvatarService.updateAvatar(
        values.profilePic as File,
        user.id,
        null // No current avatar to replace since this is profile completion
      );

      if (!uploadResult.success) {
        return { ok: false, error: uploadResult.error };
      }

      newImageKey = uploadResult.data.storageKey; // Note: using storageKey instead of imageKey
    }

    // Apply DB updates with audit logging in a transaction
    const auditContext = await getEnhancedAuditContext();

    try {
      const result = await auditServerAction(
        'PROFILE_COMPLETE' as AuditAction,
        'USER' as AuditEntityType,
        async () => {
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: user.id },
              data: {
                name: values.name,
                // userId maps to userId column (unique citext)
                userId: values.userId,
                telegramHandle: values.telegram || null,
                image: newImageKey ?? undefined, // leave unchanged if null and not provided
                cityId: city.id,
                cityLastChangedAt: new Date(),
                isProfileComplete: true,
              },
            });
          });

          return { success: true };
        },
        {
          actorUserId: user.id,
          actorRole: 'USER' as AuditActorRole,
          ...auditContext,
        },
        undefined,
        'User completed profile setup'
      );

      return { ok: true, data: { id: user.id } };
    } catch (e: any) {
      // Compensation: remove the just-uploaded image if DB write failed
      if (newImageKey) {
        const { deleteCloudinaryImage } = await import('@/lib/image-utils-server');
        await deleteCloudinaryImage(newImageKey).catch(() => {});
      }

      // Check if it's a unique constraint violation on userId
      if (e.code === 'P2002' && e.meta?.target?.includes('userId')) {
        return { ok: false, error: 'This User ID is already taken.' };
      }

      const msg = e?.message || 'Failed to update profile';
      return { ok: false, error: msg };
    }
  } catch (e: any) {
    const msg = e?.message || 'Unexpected server error';
    return { ok: false, error: msg };
  }
}
