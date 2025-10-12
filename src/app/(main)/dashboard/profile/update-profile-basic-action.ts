'use server';

import {
  isUserIdAvailable,
  updateProfileName,
  updateProfileTelegram,
  updateProfileUserId,
} from '@/data/user/user.dal';
import { requireUser } from '@/lib/auth/server';
import { profileBasicsSchema } from '@/lib/schemas/dashboard';

export type UpdateProfileBasicsResult =
  | { ok: true; data: { success: true } }
  | { ok: false; error: string };

export async function updateProfileBasicsAction(
  formData: FormData
): Promise<UpdateProfileBasicsResult> {
  try {
    // Authenticate user
    const user = await requireUser();

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      userId: formData.get('userId') as string,
      telegram: formData.get('telegram') as string,
    };

    // Validate with Zod schema
    const validationResult = profileBasicsSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message);
      return { ok: false, error: errors.join(', ') };
    }

    const validatedData = validationResult.data;

    // Check userId availability (excluding current user's ID)
    const availabilityCheck = await isUserIdAvailable(
      validatedData.userId,
      user.userId || undefined
    );

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

    let hasChanges = false;

    // Update only changed fields using current user data
    if (validatedData.name !== user.name) {
      await updateProfileName(user.id, validatedData.name, {
        before: user.name,
        newValue: validatedData.name,
      });
      hasChanges = true;
    }

    if (validatedData.userId !== (user.userId || '')) {
      await updateProfileUserId(user.id, validatedData.userId, {
        before: user.userId || '',
        newValue: validatedData.userId,
      });
      hasChanges = true;
    }

    if (validatedData.telegram !== (user.telegramHandle || '')) {
      await updateProfileTelegram(user.id, validatedData.telegram, {
        before: user.telegramHandle || '',
        newValue: validatedData.telegram || null,
      });
      hasChanges = true;
    }

    if (!hasChanges) {
      return { ok: false, error: 'No changes detected' };
    }

    return { ok: true, data: { success: true } };
  } catch (error: any) {
    // Handle specific database errors
    if (error.code === 'P2002' && error.meta?.target?.includes('userId')) {
      return { ok: false, error: 'This User ID is already taken.' };
    }

    const message = error?.message || 'Failed to update profile';
    return { ok: false, error: message };
  }
}
