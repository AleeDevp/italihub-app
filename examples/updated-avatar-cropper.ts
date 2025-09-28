/**
 * Example: Migration Patterns for Client/Server Image System
 *
 * This shows how to migrate existing image-related code
 * to use the new unified client/server image system:
 * - image-utils-client.ts (client-safe utilities)
 * - image-utils-server.ts (server-only operations)
 */

// =============================================================================
// IMPORT MIGRATION PATTERNS
// =============================================================================

// ❌ OLD: Multiple scattered imports
/*
import { uploadImageToCloudinary } from '@/lib/actions/uploud-image-cloudinary';
import { deleteCloudinaryByStorageKey } from '@/lib/actions/uploud-image-cloudinary';
import { formatFileSize } from '@/lib/utils/file';
import { cropImageToBlob } from '@/lib/utils/image-cropping';
import { resolveImageUrl } from '@/lib/utils/reasolve-image-url';
import { cldUrl } from '@/lib/cloudinary';
import { Step4Schema } from '@/lib/schemas/complete-profile-schema';
*/

// ✅ NEW: Client-side imports (React components, hooks)
/*
import {
  createImageSchema,
  generateResponsiveUrls,
  resolveImageUrl,
  validateImageFile,
  cropImageToBlob,
  formatFileSize,
  type ImageType,
  type CropArea,
} from '@/lib/image-utils-client';
*/

// ✅ NEW: Server-side imports (server actions, API routes)
/*
import {
  AvatarService,
  CoverPhotoService,
  GalleryService,
  ImageService,
  uploadImageToCloudinary,
  deleteCloudinaryImage,
} from '@/lib/image-utils-server';
*/

// =============================================================================
// VALIDATION MIGRATION PATTERNS
// =============================================================================

// ❌ OLD: Using Step4Schema for all image validation
/*
const validateOldWay = (file: File) => {
  const validation = Step4Schema.safeParse({ profilePic: file });
  if (!validation.success) {
    return validation.error.issues[0]?.message;
  }
  return null;
};
*/

// ✅ NEW: Type-specific validation (CLIENT-SIDE)
/*
import { validateImageFile, createImageSchema } from '@/lib/image-utils-client';

const validateNewWay = (file: File, imageType: 'avatar' | 'cover' | 'gallery' | 'content') => {
  // Method 1: Direct validation (client-side)
  const result = validateImageFile(file, imageType);
  if (!result.success) {
    return result.error;
  }

  // Method 2: Schema-based validation (client-side)
  const schema = createImageSchema(imageType);
  const validation = schema.safeParse(file);
  if (!validation.success) {
    return validation.error.issues[0]?.message;
  }

  return null;
};
*/

// =============================================================================
// CLIENT/SERVER WORKFLOW PATTERNS
// =============================================================================

// ✅ COMPLETE EXAMPLE: Client Component with Server Action

/*
// CLIENT COMPONENT (React) - File: components/avatar-upload.tsx
'use client';
import { useState } from 'react';
import { validateImageFile, cropImageToBlob, type CropArea } from '@/lib/image-utils-client';
import { uploadAvatarAction } from '@/lib/actions/avatar';

export function AvatarUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleAvatarUpload = async (file: File, cropArea?: CropArea) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Client-side validation (immediate feedback)
      const validation = validateImageFile(file, 'avatar');
      if (!validation.success) {
        setError(validation.error);
        setLoading(false);
        return;
      }

      // 2. Optional cropping (client-side)
      const finalFile = cropArea 
        ? await cropImageToBlob(file, cropArea, 'avatar')
        : file;

      // 3. Upload via server action
      const result = await uploadAvatarAction(finalFile);
      
      if (result.success) {
        setAvatarUrl(result.data.secureUrl);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Your component JSX here
    <div>Avatar Upload Component</div>
  );
}
*/

/*
// SERVER ACTION - File: lib/actions/avatar.ts
'use server';
import { AvatarService } from '@/lib/image-utils-server';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function uploadAvatarAction(file: File) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Service handles validation, upload, cleanup automatically
    const result = await AvatarService.updateAvatar(
      file, 
      user.id, 
      user.image // current avatar for cleanup
    );

    if (result.success) {
      // Update database with new avatar URL
      await updateUserAvatar(user.id, result.data.storageKey);
      
      // Revalidate relevant pages
      revalidatePath('/dashboard/profile');
    }

    return result;
  } catch (error) {
    return { success: false, error: 'Upload failed' };
  }
}
*/

// =============================================================================
// UPLOAD MIGRATION PATTERNS
// =============================================================================

// ❌ OLD: Manual upload process with complex error handling
/*
const uploadOldWay = async (file: File, userId: string) => {
  try {
    // Manual validation
    const validation = Step4Schema.safeParse({ profilePic: file });
    if (!validation.success) {
      throw new Error(validation.error.issues[0]?.message);
    }

    // Upload
    const result = await uploadImageToCloudinary(file, userId);
    
    // Manual cleanup of old image
    if (currentImageKey) {
      await deleteCloudinaryByStorageKey(currentImageKey);
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
*/

// ✅ NEW: Client validation + Server action pattern
/*
// In client component
const handleClientUpload = async (file: File) => {
  // 1. Client-side validation (immediate feedback)
  const validation = validateImageFile(file, 'avatar');
  if (!validation.success) {
    setError(validation.error);
    return;
  }

  // 2. Call server action
  const result = await uploadAvatarServerAction(file);
  if (result.success) {
    setSuccess(true);
  } else {
    setError(result.error);
  }
};

// In server action file
export async function uploadAvatarServerAction(file: File) {
  const userId = await getCurrentUserId();
  const currentImageKey = await getCurrentUserAvatar(userId);
  
  // Service call handles everything
  return await AvatarService.updateAvatar(file, userId, currentImageKey);
}
*/

// =============================================================================
// SERVICE MIGRATION PATTERNS
// =============================================================================

// ❌ OLD: Complex manual service
/*
class OldProfilePictureService {
  static async updateProfilePicture(userId: string, file: File) {
    // 50+ lines of manual validation, upload, cleanup, error handling...
  }
}
*/

// ✅ NEW: Simple service usage (SERVER-SIDE ONLY)
/*
import { AvatarService } from '@/lib/image-utils-server';

class NewProfilePictureService {
  static async updateProfilePicture(userId: string, file: File, currentImageKey?: string | null) {
    // All complexity handled by AvatarService
    return await AvatarService.updateAvatar(file, userId, currentImageKey);
  }

  static async deleteProfilePicture(storageKey: string) {
    return await AvatarService.deleteAvatar(storageKey);
  }
}
*/

// =============================================================================
// URL RESOLUTION MIGRATION PATTERNS
// =============================================================================

// ❌ OLD: Limited URL resolution
/*
const getImageUrlOld = (storageKey: string, width?: number) => {
  if (width) {
    return cldUrl(storageKey, { w: width });
  }
  return resolveImageUrl(storageKey);
};
*/

// ✅ NEW: Enhanced URL resolution (CLIENT-SIDE)
/*
import { resolveImageUrl, generateResponsiveUrls } from '@/lib/image-utils-client';

const getImageUrlNew = (storageKey: string) => {
  // Method 1: Basic resolution with options
  return resolveImageUrl(storageKey, {
    width: 400,
    height: 300,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
  });
};

// Method 2: Responsive URLs
const getResponsiveUrls = (publicId: string) => {
  return generateResponsiveUrls(publicId, 800);
  // Returns: { small: "...", medium: "...", large: "...", xlarge: "..." }
};
*/

// =============================================================================
// BATCH OPERATIONS (NEW FEATURE)
// =============================================================================

// ✅ CLIENT: Multiple file validation
/*
const validateMultipleFiles = (files: File[]) => {
  const results = files.map(file => validateImageFile(file, 'gallery'));
  const failed = results.filter(r => !r.success);
  
  if (failed.length > 0) {
    return { success: false, errors: failed.map(f => f.error) };
  }
  
  return { success: true };
};
*/

// ✅ SERVER: Batch upload via server action
/*
// In server action file
export async function batchUploadGalleryAction(files: File[]) {
  const userId = await getCurrentUserId();
  const result = await ImageService.batchUploadImages(files, userId, 'gallery');
  return result;
}
*/

// =============================================================================
// CLIENT/SERVER BEST PRACTICES
// =============================================================================

/*
✅ DO:
- Import client utilities in React components from @/lib/image-utils-client
- Import server services in server actions from @/lib/image-utils-server
- Validate files on client-side for immediate user feedback
- Use server actions to call server services from client components
- Keep file processing (cropping) on client-side when possible
- Use TypeScript types from image-utils-client in both contexts

❌ DON'T:
- Import @/lib/image-utils-server in client components (causes build errors)
- Call AvatarService directly from React components
- Skip client-side validation (poor user experience)
- Put Cloudinary operations in client-side code
- Mix Node.js modules in browser code
*/

// =============================================================================
// MIGRATION CHECKLIST
// =============================================================================

/*
1. IDENTIFY FILE TYPE:
   □ Client component/hook → use @/lib/image-utils-client
   □ Server action/API route → use @/lib/image-utils-server

2. UPDATE IMPORTS:
   □ Replace scattered imports with appropriate client/server imports
   □ Remove old service imports

3. UPDATE WORKFLOW:
   □ Client: Validate files, generate URLs, crop images
   □ Server: Upload files, manage storage, update database

4. UPDATE FUNCTION CALLS:
   □ Use new service methods (AvatarService.updateAvatar)
   □ Use new validation functions (validateImageFile)
   □ Use new URL functions (resolveImageUrl)

5. TEST:
   □ Verify no "Module not found: Can't resolve 'fs'" errors
   □ Test client-side validation works
   □ Test server-side uploads work
   □ Run TypeScript check and build

6. CLEANUP:
   □ Remove old import statements
   □ Remove old service files (after migration complete)
   □ Update component props and interfaces
*/

export default {
  title: 'Image System Migration Examples',
  description: 'Complete examples for migrating to the new client/server image architecture',
};
