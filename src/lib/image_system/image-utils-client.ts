/**
 * Client-Side Image Utilities
 *
 * This file contains image-related functionality that can be safely used on the client side.
 * Server-side operations (Cloudinary upload/delete) are in separate server-only files.
 */

import { VerificationFileRole } from '@/generated/prisma';
import {} from '@/lib/utils/enum-utils';
import { z } from 'zod';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Supported image types for different use cases
 */
export type ImageType =
  | 'avatar' // Profile pictures - square, optimized for small display
  | 'cover' // Cover photos - wide aspect ratio
  | 'gallery' // Gallery images - various sizes, high quality
  | 'thumbnail' // Thumbnail images - small, optimized
  | 'content' // Content images - blog posts, articles
  | 'background' // Background images - large, optimized
  | 'icon' // Icons and logos - small, crisp
  | 'banner' // Banner images - wide, medium quality
  | 'verification' // User verification documents/images
  | 'ad-housing'; // Housing ad listing images (multiple per ad)

/**
 * Image configuration for different types
 */
export interface ImageTypeConfig {
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
  dimensions?: {
    width?: number;
    height?: number;
    aspectRatio?: string; // e.g., "16:9", "1:1"
  };
  quality?: 'auto' | number;
  folder: string; // Cloudinary folder structure
}

/**
 * Image type configurations
 */
export const IMAGE_TYPE_CONFIGS: Record<ImageType, ImageTypeConfig> = {
  avatar: {
    maxSizeBytes: 6 * 1024 * 1024, // 6MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
    dimensions: { width: 256, height: 256, aspectRatio: '1:1' },
    quality: 90,
    folder: 'profiles',
  },
  cover: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
    dimensions: { width: 1200, height: 400, aspectRatio: '3:1' },
    quality: 90,
    folder: 'covers',
  },
  gallery: {
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/tiff',
    ] as const,
    quality: 90,
    folder: 'gallery',
  },
  thumbnail: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    dimensions: { width: 150, height: 150 },
    quality: 75,
    folder: 'thumbnails',
  },
  content: {
    maxSizeBytes: 8 * 1024 * 1024, // 8MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
    quality: 'auto',
    folder: 'content',
  },
  background: {
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    dimensions: { width: 1920, height: 1080 },
    quality: 75,
    folder: 'backgrounds',
  },
  icon: {
    maxSizeBytes: 1 * 1024 * 1024, // 1MB
    allowedMimeTypes: ['image/png', 'image/svg+xml', 'image/webp'] as const,
    dimensions: { width: 64, height: 64 },
    quality: 90,
    folder: 'icons',
  },
  banner: {
    maxSizeBytes: 12 * 1024 * 1024, // 12MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    dimensions: { width: 1200, height: 300, aspectRatio: '4:1' },
    quality: 75,
    folder: 'banners',
  },
  verification: {
    maxSizeBytes: 8 * 1024 * 1024, // 8MB
    // Accept only images for verification documents
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
    // No forced dimensions; keep originals to preserve text clarity
    quality: 90,
    folder: 'verification',
  },
  'ad-housing': {
    // Housing listing photos: allow relatively large high-quality images
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
    // No fixed dimensions; keep originals, let UI request sizes as needed
    quality: 90,
    // Cloudinary folder for housing ads
    folder: 'ads/housing',
  },
};

/**
 * Image processing options
 */
export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'pad';
  gravity?: 'center' | 'north' | 'south' | 'east' | 'west' | 'face' | 'faces';
  quality?: number | 'auto';
  format?: 'jpg' | 'png' | 'webp' | 'avif' | 'auto';
  dpr?: number | 'auto';
}

/**
 * Crop area for image cropping
 */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * File metadata for client-side operations
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  url: string;
  id: string;
}

/**
 * File with preview for upload components
 */
export interface FileWithPreview {
  file: File | FileMetadata;
  id: string;
  preview?: string;
}

/**
 * Service result types
 */
export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Error types for different image operations
 */
export type ImageError =
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'UPLOAD_FAILED'
  | 'DATABASE_ERROR'
  | 'USER_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'PROCESSING_ERROR'
  | 'NETWORK_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'CORRUPTED_FILE'
  | 'UNSUPPORTED_OPERATION';

/**
 * Error messages for different image operations
 */
export const IMAGE_ERROR_MESSAGES: Record<ImageError, string> = {
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size',
  INVALID_FILE_TYPE: 'File type is not supported for this image type',
  UPLOAD_FAILED: 'Failed to upload image to cloud storage',
  DATABASE_ERROR: 'Failed to update database with image information',
  USER_NOT_FOUND: 'User not found',
  VALIDATION_ERROR: 'Image validation failed',
  PROCESSING_ERROR: 'Failed to process image',
  NETWORK_ERROR: 'Network error during image operation',
  QUOTA_EXCEEDED: 'Upload quota exceeded',
  CORRUPTED_FILE: 'Image file appears to be corrupted',
  UNSUPPORTED_OPERATION: 'Operation not supported for this image type',
};

// =============================================================================
// Validation System
// =============================================================================

/**
 * Create Zod schema for specific image type
 */
export function createImageSchema(imageType: ImageType) {
  const config = IMAGE_TYPE_CONFIGS[imageType];

  return z.any().superRefine((file, ctx) => {
    // Handle both File objects and null/undefined
    if (!file) return; // Allow null/undefined for optional images

    if (!(file instanceof File)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid file object' });
      return;
    }

    const { size, type } = file;

    // Check file size
    if (size > config.maxSizeBytes) {
      ctx.addIssue({
        code: 'custom',
        message: `File size exceeds ${formatFileSize(config.maxSizeBytes)} limit`,
      });
    }

    // Reject animated GIFs for most image types
    if (type === 'image/gif' && imageType !== 'content') {
      ctx.addIssue({
        code: 'custom',
        message: 'Animated GIFs are not allowed for this image type',
      });
      return;
    }

    // Check allowed MIME types
    if (!config.allowedMimeTypes.includes(type as any)) {
      const allowedTypes = config.allowedMimeTypes.join(', ');
      ctx.addIssue({
        code: 'custom',
        message: `Unsupported image format. Allowed formats: ${allowedTypes}`,
      });
    }
  });
}

/**
 * Validate image file for specific type
 */
export function validateImageFile(file: File, imageType: ImageType): ServiceResult<void> {
  try {
    const schema = createImageSchema(imageType);
    const result = schema.safeParse(file);

    if (!result.success) {
      const errorMessage =
        result.error.issues?.[0]?.message || IMAGE_ERROR_MESSAGES.VALIDATION_ERROR;
      return { success: false, error: errorMessage };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return handleServiceError(error, IMAGE_ERROR_MESSAGES.VALIDATION_ERROR);
  }
}

// =============================================================================
// File Utilities
// =============================================================================

/**
 * Convert bytes to human-readable format
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Detect file type (by MIME) and return a simple extension keyword
 * - Returns common image extensions (jpg, png, webp, avif, gif, tiff, svg)
 * - Returns 'unknown' for anything else
 */
export function detectFileType(input: File | { type?: string } | string): string {
  const mime = typeof input === 'string' ? input : input?.type || '';
  if (!mime) return 'unknown';
  if (mime.startsWith('image/')) {
    if (mime.includes('jpeg') || mime.endsWith('/jpg')) return 'jpg';
    if (mime.endsWith('/png')) return 'png';
    if (mime.endsWith('/webp')) return 'webp';
    if (mime.endsWith('/avif')) return 'avif';
    if (mime.endsWith('/gif')) return 'gif';
    if (mime.endsWith('/tiff')) return 'tiff';
    if (mime === 'image/svg+xml') return 'svg';
    return 'unknown';
  }
  return 'unknown';
}

// =============================================================================
// URL Generation & Transformation (Client-Safe)
// =============================================================================

/**
 * Generate Cloudinary URL with transformations
 */
export function generateCloudinaryUrl(
  publicId: string,
  options: ImageProcessingOptions = {}
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Build transformation string
  const transformations: string[] = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.dpr) transformations.push(`dpr_${options.dpr}`);

  // Add default optimizations
  if (!options.format) transformations.push('f_auto');
  if (!options.quality) transformations.push('q_auto');
  if (!options.dpr) transformations.push('dpr_auto');

  // Strip metadata for privacy
  transformations.push('fl_strip_profile');

  const transformString = transformations.join(',');
  return `${baseUrl}/${transformString}/${publicId}`;
}

/**
 * Resolve image URL for display (handles various input formats)
 */
export function resolveImageUrl(
  image?: string | null,
  options: ImageProcessingOptions = {}
): string | null {
  if (!image || image.trim() === '') return null;

  // If it's already a full URL, blob, or public asset path, use as-is
  if (/^(https?:\/\/|\/|blob:)/.test(image)) return image;

  // Extract public ID from storage key (remove file extension)
  const publicId = image.replace(/\.[^.]+$/, '');

  try {
    return generateCloudinaryUrl(publicId, options);
  } catch (error) {
    console.warn('Failed to generate Cloudinary URL:', error);
    return null;
  }
}

/**
 * Generate optimized URL for specific image type
 */
export function getOptimizedUrl(storageKey: string, imageType: ImageType): string | null {
  const config = IMAGE_TYPE_CONFIGS[imageType];
  const publicId = storageKey.replace(/\.[^.]+$/, '');

  const options: ImageProcessingOptions = {
    quality: config.quality ?? 'auto',
  };

  // Apply type-specific dimensions if configured
  if (config.dimensions) {
    if (config.dimensions.width) options.width = config.dimensions.width;
    if (config.dimensions.height) options.height = config.dimensions.height;

    // Set appropriate crop mode based on whether both dimensions are specified
    if (config.dimensions.width && config.dimensions.height) {
      options.crop = 'fill';
      options.gravity = 'face'; // Prefer face detection for profile images
    } else {
      options.crop = 'scale';
    }
  }

  return generateCloudinaryUrl(publicId, options);
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function generateResponsiveUrls(
  publicId: string,
  baseWidth: number = 800
): Record<string, string> {
  const sizes = {
    small: Math.round(baseWidth * 0.5),
    medium: baseWidth,
    large: Math.round(baseWidth * 1.5),
    xlarge: Math.round(baseWidth * 2),
  };

  const urls: Record<string, string> = {};

  for (const [key, width] of Object.entries(sizes)) {
    urls[key] = generateCloudinaryUrl(publicId, { width, crop: 'fill' });
  }

  return urls;
}

// =============================================================================
// Image Processing (Client-Side)
// =============================================================================

/**
 * Crop image to blob with specified dimensions (client-side)
 */
export async function cropImageToBlob(
  imageUrl: string,
  area: CropArea,
  outputWidth: number = 256,
  outputHeight: number = 256
): Promise<{ blob: Blob; url: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Draw cropped region scaled to output dimensions
      ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outputWidth, outputHeight);

      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      }, 'image/png');
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/**
 * Resize image maintaining aspect ratio (client-side)
 */
export async function resizeImageToBlob(
  imageUrl: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.9
): Promise<{ blob: Blob; url: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw resized image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Error handling utility
 */
export function handleServiceError(error: unknown, defaultMessage: string): ServiceResult<never> {
  const message = error instanceof Error ? error.message : defaultMessage;
  return { success: false, error: message };
}

/**
 * Convert ServiceResult to ActionResult
 */
export function serviceToActionResult<T>(result: ServiceResult<T>): ActionResult<T> {
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return { ok: false, error: result.error };
}

// =============================================================================
// Legacy Support & Aliases
// =============================================================================

/**
 * Classify a verification upload into IMAGE, DOCUMENT, or OTHER based on MIME type.
 * - IMAGE: any "image/*" MIME (all verification files are now images)
 * - DOCUMENT: for non-selfie verification methods (ID cards, permits, etc.)
 * - OTHER: anything else (should not occur with proper validation)
 */
export function classifyVerificationFileRole(
  input: File | { type?: string } | string
): VerificationFileRole {
  const type = detectFileType(input);

  if (['jpg', 'png', 'webp', 'avif', 'gif', 'tiff', 'svg'].includes(type)) {
    return VerificationFileRole.IMAGE;
  }
  return VerificationFileRole.OTHER;
}

// Maintain backward compatibility with existing code
export const formatBytes = formatFileSize;
export const cldUrl = (storageKey: string, opts?: { w?: number }) => {
  const publicId = storageKey.replace(/\.[^.]+$/, '');
  return generateCloudinaryUrl(publicId, { width: opts?.w });
};

// Re-export commonly used types
export type { CropArea as Area }; // For backward compatibility
