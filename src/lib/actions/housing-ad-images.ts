'use server';

import { requireUser } from '@/lib/auth/server';
import {
  HousingAdImageService,
  type ImageUploadResult,
} from '@/lib/image_system/image-utils-server';

export type UploadHousingImageResult =
  | { ok: true; data: ImageUploadResult }
  | { ok: false; error: string };

/**
 * Upload a single housing ad image
 */
export async function uploadHousingImageAction(
  formData: FormData
): Promise<UploadHousingImageResult> {
  try {
    const user = await requireUser();

    const file = formData.get('housingImage') as File;
    if (!file || typeof file.arrayBuffer !== 'function') {
      return { ok: false, error: 'No valid file provided' };
    }

    const result = await HousingAdImageService.upload(file, user.id);
    if (!result.success) return { ok: false, error: result.error };

    return { ok: true, data: result.data };
  } catch (error: any) {
    const msg = error?.message || 'Image upload failed';
    return { ok: false, error: msg };
  }
}

/**
 * Delete a housing ad image by storage key
 */
export async function deleteHousingImageAction(
  storageKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    if (!storageKey) return { ok: false, error: 'Invalid image' };

    // Best-effort delete; ignore ownership at storage layer, rely on DB later if needed
    const res = await HousingAdImageService.deleteImage(storageKey);
    if (!res.success) return { ok: false, error: res.error };
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Failed to delete image' };
  }
}
