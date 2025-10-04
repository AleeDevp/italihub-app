import { v2 as cloudinary } from 'cloudinary';
import type { IStorageProvider, UploadOptions, UploadResult } from './types';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export class CloudinaryProvider implements IStorageProvider {
  async uploadBuffer(buffer: Buffer, opts: UploadOptions): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        public_id: opts.publicId,
        folder: opts.folder,
        resource_type: opts.resourceType ?? 'auto',
        overwrite: true,
        use_filename: false,
        unique_filename: true,
        quality_analysis: true,
      };
      if (opts.transformation) uploadOptions.transformation = opts.transformation;

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));

        const storageKey = `${result.public_id}.${result.format}`;
        resolve({
          storageKey,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
          url: result.url!,
          secureUrl: result.secure_url!,
        });
      });

      stream.end(buffer);
    });
  }

  async deleteByStorageKey(storageKey: string): Promise<void> {
    if (!storageKey) return;
    const publicId = storageKey.replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  }

  async deleteManyByStorageKeys(storageKeys: string[]): Promise<void> {
    if (!storageKeys.length) return;
    const publicIds = storageKeys.map((k) => k.replace(/\.[^.]+$/, ''));
    await cloudinary.api.delete_resources(publicIds);
  }

  getPreviewUrl(publicId: string, options?: { width?: number; page?: number }): string | null {
    const page = options?.page ?? 1;
    const width = options?.width ?? 600;
    return cloudinary.url(publicId, {
      resource_type: 'image',
      format: 'jpg',
      transformation: [{ page, width, crop: 'scale' }],
      secure: true,
    });
  }

  getSignedUrl(storageKey: string, options?: { resourceType?: 'image' | 'raw' }): string | null {
    const publicId = storageKey.replace(/\.[^.]+$/, '');
    return cloudinary.url(publicId, {
      resource_type: options?.resourceType ?? 'image',
      sign_url: true,
      secure: true,
    });
  }
}
