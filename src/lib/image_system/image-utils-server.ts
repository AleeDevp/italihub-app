/**
 * Server-Only Image Operations
 *
 * This file contains server-side image operations that use Node.js modules
 * and should never be imported on the client side.
 */

import { fileTypeFromBuffer } from 'file-type';
import crypto from 'node:crypto';
import type { UploadOptions } from '../storage';
import { getStorageProvider } from '../storage';
import type { ImageType } from './image-utils-client';
import {
  handleServiceError,
  IMAGE_ERROR_MESSAGES,
  IMAGE_TYPE_CONFIGS,
  validateImageFile,
  type ServiceResult,
} from './image-utils-client';

// Storage provider (configurable via environment)
const storage = getStorageProvider();

// =============================================================================
// Server-Side Types
// =============================================================================

/**
 * Upload result from Cloudinary
 */
export interface ImageUploadResult {
  storageKey: string; // e.g., "profiles/userId/uuid.jpg"
  publicId: string; // e.g., "profiles/userId/uuid"
  width: number;
  height: number;
  bytes: number;
  format: string;
  mimeType: string; // normalized server-sniffed mime
  url: string; // Cloudinary URL
  secureUrl: string; // HTTPS Cloudinary URL
}

// =============================================================================
// Cloudinary Operations (Server-side)
// =============================================================================

/**
 * Upload buffer to Cloudinary with retry logic
 */
async function uploadBufferToCloudinary(
  buffer: Buffer,
  publicId: string,
  imageType: ImageType
): Promise<ImageUploadResult> {
  const config = IMAGE_TYPE_CONFIGS[imageType];

  // Always use image resource type since we only accept images now
  const resourceType: UploadOptions['resourceType'] = 'image';

  // Add type-specific transformations
  const transformation: Record<string, any> = {};
  if (config.dimensions) {
    if (config.dimensions.width && config.dimensions.height) {
      transformation.width = config.dimensions.width;
      transformation.height = config.dimensions.height;
      transformation.crop = 'fill';
      transformation.gravity = 'face';
    } else if (config.dimensions.width) {
      transformation.width = config.dimensions.width;
      transformation.crop = 'scale';
    } else if (config.dimensions.height) {
      transformation.height = config.dimensions.height;
      transformation.crop = 'scale';
    }
  }

  const start = Date.now();
  const result = await storage.uploadBuffer(buffer, {
    publicId,
    folder: config.folder,
    resourceType,
    transformation: Object.keys(transformation).length ? transformation : undefined,
  });
  const ms = Date.now() - start;
  console.info('[image] upload', { imageType, publicId: result.publicId, bytes: result.bytes, ms });
  return {
    storageKey: result.storageKey,
    publicId: result.publicId,
    width: result.width ?? 0,
    height: result.height ?? 0,
    bytes: result.bytes ?? buffer.byteLength,
    format: result.format ?? 'bin',
    // will be overridden by caller with sniffed value
    mimeType: 'application/octet-stream',
    url: result.url,
    secureUrl: result.secureUrl,
  };
}

/**
 * Upload image file to Cloudinary with comprehensive validation
 */
export async function uploadImageToCloudinary(
  file: File,
  userId: string,
  imageType: ImageType = 'content'
): Promise<ImageUploadResult> {
  try {
    // 1. Validate file
    const validation = validateImageFile(file, imageType);
    if (!validation.success) {
      throw new Error(validation.error);
    }

    // 2. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2.1 Server-side MIME verification (magic number sniffing)
    const sniff = await fileTypeFromBuffer(buffer).catch(() => null);
    const sniffedMime = sniff?.mime || file.type || '';
    const allowed = (IMAGE_TYPE_CONFIGS[imageType].allowedMimeTypes as readonly string[]).includes(
      sniffedMime as any
    );
    if (!allowed) {
      throw new Error('Server-side MIME verification failed');
    }

    // 3. Generate public ID with folder structure
    const config = IMAGE_TYPE_CONFIGS[imageType];
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const uniqueId = crypto.randomUUID();
    const publicId = buildPublicId(config.folder, userId, hash, uniqueId);

    // 4. Upload to Cloudinary
    const uploaded = await uploadBufferToCloudinary(buffer, publicId, imageType);

    // Image uploaded successfully

    // Override with server-verified MIME type for security
    return { ...uploaded, mimeType: sniffedMime };
  } catch (error: any) {
    const message = error?.message || IMAGE_ERROR_MESSAGES.UPLOAD_FAILED;
    throw new Error(message);
  }
}

/**
 * Delete image from Cloudinary by storage key
 */
export async function deleteCloudinaryImage(storageKey: string): Promise<void> {
  try {
    if (!storageKey) return;

    const start = Date.now();
    await storage.deleteByStorageKey(storageKey);
    console.info('[image] delete', { storageKey, ms: Date.now() - start });
  } catch (error) {
    // Log error but don't throw - deletion is often best-effort
    console.warn('Failed to delete image from Cloudinary:', error);
  }
}

/**
 * Bulk delete multiple images
 */
export async function bulkDeleteCloudinaryImages(storageKeys: string[]): Promise<void> {
  if (storageKeys.length === 0) return;

  try {
    const start = Date.now();
    await storage.deleteManyByStorageKeys(storageKeys);
    console.info('[image] bulk delete', { count: storageKeys.length, ms: Date.now() - start });
  } catch (error) {
    console.warn('Failed to bulk delete images from Cloudinary:', error);
  }
}

// =============================================================================
// Helpers: Signed URL for private access
// =============================================================================

/**
 * Generate a signed URL (short TTL implied via CDN config). Useful for private assets.
 * Note: Requires Cloudinary to be configured for authenticated delivery.
 */
export function getSignedUrl(storageKey: string, options?: { resourceType?: 'image' | 'raw' }) {
  return storage.getSignedUrl?.(storageKey, options) ?? null;
}

// Pure helper to build a publicId from parts (easy to unit test)
export function buildPublicId(folder: string, userId: string, hash: string, uniqueId: string) {
  return `${folder}/${userId}/${hash}-${uniqueId}`;
}

// Produce a DB-ready file record from an upload result (uses normalized mime)
export function toDbFileRecord(upload: ImageUploadResult) {
  return {
    storageKey: upload.storageKey,
    mimeType: upload.mimeType,
    bytes: upload.bytes,
  } as const;
}

// Derive a safe MIME type from a trusted storageKey extension (post-upload)
export function mimeFromStorageKey(storageKey: string): string {
  const ext = storageKey.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'gif':
      return 'image/gif';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

// =============================================================================
// Service Layer
// =============================================================================

/**
 * Generic Image Service for handling complete image workflows
 */
export class ImageService {
  /**
   * Upload image with validation and error handling
   */
  static async uploadImage(
    file: File,
    userId: string,
    imageType: ImageType = 'content'
  ): Promise<ServiceResult<ImageUploadResult>> {
    try {
      const result = await uploadImageToCloudinary(file, userId, imageType);
      return { success: true, data: result };
    } catch (error) {
      return handleServiceError(error, IMAGE_ERROR_MESSAGES.UPLOAD_FAILED);
    }
  }

  /**
   * Delete image with cleanup
   */
  static async deleteImage(storageKey: string): Promise<ServiceResult<void>> {
    try {
      await deleteCloudinaryImage(storageKey);
      return { success: true, data: undefined };
    } catch (error) {
      return handleServiceError(error, 'Failed to delete image');
    }
  }

  /**
   * Replace image (upload new, delete old)
   */
  static async replaceImage(
    newFile: File,
    oldStorageKey: string | null,
    userId: string,
    imageType: ImageType = 'content'
  ): Promise<ServiceResult<ImageUploadResult>> {
    try {
      // Upload new image first
      const uploadResult = await ImageService.uploadImage(newFile, userId, imageType);

      if (!uploadResult.success) {
        return uploadResult;
      }

      // Delete old image (best effort)
      if (oldStorageKey) {
        await ImageService.deleteImage(oldStorageKey);
      }

      return uploadResult;
    } catch (error) {
      return handleServiceError(error, 'Failed to replace image');
    }
  }

  /**
   * Validate multiple images
   */
  static validateImages(files: File[], imageType: ImageType): ServiceResult<void> {
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const validation = validateImageFile(files[i], imageType);
      if (!validation.success) {
        errors.push(`File ${i + 1}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      return { success: false, error: errors.join('; ') };
    }

    return { success: true, data: undefined };
  }

  /**
   * Batch upload images
   */
  static async batchUploadImages(
    files: File[],
    userId: string,
    imageType: ImageType = 'content'
  ): Promise<ServiceResult<ImageUploadResult[]>> {
    try {
      // Validate all files first
      const validation = ImageService.validateImages(files, imageType);
      if (!validation.success) {
        return validation as ServiceResult<ImageUploadResult[]>;
      }

      // Upload all files
      const uploadPromises = files.map((file) => ImageService.uploadImage(file, userId, imageType));

      const results = await Promise.all(uploadPromises);

      // Check if any uploads failed
      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        // Cleanup any successful uploads
        const successes = results.filter((r) => r.success) as {
          success: true;
          data: ImageUploadResult;
        }[];
        const storageKeys = successes.map((r) => r.data.storageKey);
        await bulkDeleteCloudinaryImages(storageKeys);

        return { success: false, error: `${failures.length} upload(s) failed` };
      }

      // Return all successful results
      const data = results.map((r) => (r as { success: true; data: ImageUploadResult }).data);
      return { success: true, data };
    } catch (error) {
      return handleServiceError(error, 'Batch upload failed');
    }
  }
}

// =============================================================================
// Specialized Services for Different Image Types
// =============================================================================

/**
 * Avatar/Profile Picture Service
 */
export class AvatarService extends ImageService {
  static async updateAvatar(
    file: File,
    userId: string,
    currentStorageKey?: string | null
  ): Promise<ServiceResult<ImageUploadResult>> {
    return ImageService.replaceImage(file, currentStorageKey || null, userId, 'avatar');
  }

  static async deleteAvatar(storageKey: string): Promise<ServiceResult<void>> {
    return ImageService.deleteImage(storageKey);
  }
}

/**
 * Cover Photo Service
 */
export class CoverPhotoService extends ImageService {
  static async updateCoverPhoto(
    file: File,
    userId: string,
    currentStorageKey?: string | null
  ): Promise<ServiceResult<ImageUploadResult>> {
    return ImageService.replaceImage(file, currentStorageKey || null, userId, 'cover');
  }
}

/**
 * Gallery Service
 */
export class GalleryService extends ImageService {
  static async addGalleryImages(
    files: File[],
    userId: string
  ): Promise<ServiceResult<ImageUploadResult[]>> {
    return ImageService.batchUploadImages(files, userId, 'gallery');
  }
}

/**
 * Content Image Service (for blog posts, articles, etc.)
 */
export class ContentImageService extends ImageService {
  static async uploadContentImage(
    file: File,
    userId: string
  ): Promise<ServiceResult<ImageUploadResult>> {
    return ImageService.uploadImage(file, userId, 'content');
  }
}

/**
 * Verification Image Service
 * - Accepts only images for verification documents
 * - No aggressive transformations to keep text legible
 */
export class VerificationImageService extends ImageService {
  static async uploadVerificationFile(
    file: File,
    userId: string
  ): Promise<ServiceResult<ImageUploadResult>> {
    return ImageService.uploadImage(file, userId, 'verification');
  }

  static async uploadMultipleVerificationFiles(
    files: File[],
    userId: string
  ): Promise<ServiceResult<ImageUploadResult[]>> {
    return ImageService.batchUploadImages(files, userId, 'verification');
  }
}

/**
 * Housing Ad Image Service
 * - Multiple listing images per ad (up to 8 at UI level)
 * - Uses 'ad-housing' image type configuration
 */
export class HousingAdImageService extends ImageService {
  static async upload(file: File, userId: string): Promise<ServiceResult<ImageUploadResult>> {
    return ImageService.uploadImage(file, userId, 'ad-housing');
  }

  static async uploadMany(
    files: File[],
    userId: string
  ): Promise<ServiceResult<ImageUploadResult[]>> {
    return ImageService.batchUploadImages(files, userId, 'ad-housing');
  }

  static async replace(
    newFile: File,
    oldStorageKey: string | null,
    userId: string
  ): Promise<ServiceResult<ImageUploadResult>> {
    return ImageService.replaceImage(newFile, oldStorageKey, userId, 'ad-housing');
  }
}

// All services are already exported above
