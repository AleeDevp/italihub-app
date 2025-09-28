/**
 * Server-Only Image Operations
 *
 * This file contains server-side image operations that use Node.js modules
 * and should never be imported on the client side.
 */

import { v2 as cloudinary } from 'cloudinary';
import crypto from 'node:crypto';
import type { ImageType, ServiceResult } from './image-utils-client';
import {
  handleServiceError,
  IMAGE_ERROR_MESSAGES,
  IMAGE_TYPE_CONFIGS,
  validateImageFile,
} from './image-utils-client';

// =============================================================================
// Configuration & Setup
// =============================================================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

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

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      folder: config.folder,
      use_filename: false,
      unique_filename: true,
      quality_analysis: true,
    };

    // Add type-specific transformations
    if (config.dimensions) {
      const transformation: Record<string, any> = {};

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

      if (Object.keys(transformation).length > 0) {
        uploadOptions.transformation = transformation;
      }
    }

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        reject(error || new Error('Upload failed'));
        return;
      }

      const storageKey = `${result.public_id}.${result.format}`;
      resolve({
        storageKey,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
        url: result.url,
        secureUrl: result.secure_url,
      });
    });

    stream.end(buffer);
  });
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

    // 3. Generate public ID with folder structure
    const config = IMAGE_TYPE_CONFIGS[imageType];
    const uniqueId = crypto.randomUUID();
    const publicId = `${config.folder}/${userId}/${uniqueId}`;

    // 4. Upload to Cloudinary
    return await uploadBufferToCloudinary(buffer, publicId, imageType);
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

    // Extract public ID (remove file extension)
    const publicId = storageKey.replace(/\.[^.]+$/, '');

    await cloudinary.uploader.destroy(publicId);
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
    const publicIds = storageKeys.map((key) => key.replace(/\.[^.]+$/, ''));
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.warn('Failed to bulk delete images from Cloudinary:', error);
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

// Export cloudinary instance for advanced usage
export { cloudinary };

// All services are already exported above
