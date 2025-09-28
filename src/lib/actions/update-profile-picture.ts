'use server';

import { requireUser } from '@/lib/auth';
import { getUserProfilePicture, updateUserProfilePicture } from '@/lib/dal/user';
import { AvatarService } from '@/lib/image-utils-server';

export type UpdateProfilePictureResult =
  | { ok: true; data: { imageKey: string } }
  | { ok: false; error: string };

/**
 * Server action for updating user profile picture
 * Uses better-auth for user authentication and modular service for business logic
 */
export async function updateProfilePictureAction(
  formData: FormData
): Promise<UpdateProfilePictureResult> {
  try {
    // Authenticate user using better-auth
    const user = await requireUser();

    // Extract and validate file from FormData
    const file = formData.get('profilePic') as File;
    if (!file || typeof file.arrayBuffer !== 'function') {
      return { ok: false, error: 'No valid file provided' };
    }

    // Get current profile picture for cleanup
    let currentImageKey: string | null = null;
    try {
      currentImageKey = await getUserProfilePicture(user.id);
    } catch (error) {
      // Continue even if we can't get current image - not critical
      console.warn('Could not retrieve current profile picture for cleanup:', error);
    }

    // Use AvatarService for image operations
    const result = await AvatarService.updateAvatar(file, user.id, currentImageKey);

    if (!result.success) {
      return { ok: false, error: result.error };
    }

    // Update database with new image key
    try {
      await updateUserProfilePicture(user.id, result.data.storageKey);
    } catch (error) {
      // Critical error - try to rollback by deleting uploaded image
      try {
        await AvatarService.deleteAvatar(result.data.storageKey);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded image after database error:', cleanupError);
      }

      const message = error instanceof Error ? error.message : 'Database update failed';
      return { ok: false, error: message };
    }

    return { ok: true, data: { imageKey: result.data.storageKey } };
  } catch (error: any) {
    // Handle authentication or unexpected errors
    const message = error?.message || 'Authentication failed';
    return { ok: false, error: message };
  }
}
