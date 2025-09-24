'use server';

import { deleteCloudinaryByStorageKey } from '@/lib/actions/uploud-image-cloudinary';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/require-user';

export type DeleteProfilePhotoResult = { ok: true } | { ok: false; error: string };

export async function deleteProfilePhoto(): Promise<DeleteProfilePhotoResult> {
  try {
    const user = await requireUser();
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    if (!current?.image) {
      // Nothing to delete; ensure DB is null and return success
      await prisma.user.update({ where: { id: user.id }, data: { image: null } });
      return { ok: true };
    }

    // Best-effort delete the asset from Cloudinary first
    await deleteCloudinaryByStorageKey(current.image).catch(() => {});

    // Then null out the image key on the user
    await prisma.user.update({ where: { id: user.id }, data: { image: null } });
    return { ok: true };
  } catch (e: any) {
    const msg = e?.message || 'Failed to delete profile photo';
    return { ok: false, error: msg };
  }
}

// how to use delete in UI (optional)
// In a client component where you render the avatar, add a “Delete photo” button and call the server action:
// import { deleteProfilePhoto } from '@/lib/actions/delete-profile-photo'
// await deleteProfilePhoto(); then optimistic UI update or reload user session/profile
// Since UserAvatar now computes URLs client-side, once user.image is null, the fallback will render instantly.
