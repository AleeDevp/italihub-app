'use server';

// Pure Cloudinary upload helper (no DB writes here).
// Exports:
// - uploadImageToCloudinary(file, userId): uploads and returns metadata needed to persist later
// - deleteCloudinaryByStorageKey(storageKey): best-effort cleanup helper

import { cloudinary } from '@/lib/cloudinary';
import crypto from 'node:crypto';

export type UploadResult = {
  storageKey: string; // e.g., profiles/USERID/UUID.jpg
  publicId: string; // e.g., profiles/USERID/UUID
  width: number;
  height: number;
  bytes: number;
};

function uploadBufferToCloudinary(buf: Buffer, publicId: string) {
  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId, // e.g., "profiles/USERID/UUID"
        resource_type: 'image',
        overwrite: true,
      },
      (err, res) => {
        if (err || !res) return reject(err);
        const storageKey = `${res.public_id}.${res.format}`;
        resolve({
          storageKey,
          publicId: res.public_id!,
          width: res.width!,
          height: res.height!,
          bytes: res.bytes!,
        });
      }
    );
    stream.end(buf);
  });
}

export async function uploadImageToCloudinary(file: File, userId: string): Promise<UploadResult> {
  try {
    if (!file) throw new Error('No file provided');
    const type = (file as any).type as string | undefined;
    if (!type) throw new Error('Invalid file');
    // Allowlist of MIME types; explicitly reject GIF/animated formats
    const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
    if (type === 'image/gif') throw new Error('Animated GIFs are not allowed');
    if (!ALLOWED.has(type)) throw new Error('Unsupported image format');

    const maxBytes = 6 * 1024 * 1024; // 6 MB cap
    if (file.size > maxBytes) throw new Error('File too large (max 6 MB)');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const publicId = `profiles/${userId}/${crypto.randomUUID()}`;
    return await uploadBufferToCloudinary(buffer, publicId);
  } catch (err: any) {
    const msg = err?.message || 'Cloud upload failed';
    throw new Error(msg);
  }
}

export async function deleteCloudinaryByStorageKey(storageKey: string): Promise<void> {
  try {
    if (!storageKey) return;
    const publicId = storageKey.replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // best-effort cleanup — swallow errors
  }
}
