# Image System Migration Guide

This guide helps migrate from the scattered image-related files to the new unified `image-utils.ts` system.

## Overview

The new system consolidates all image functionality into a unified architecture split between client and server modules with these benefits:

- **Unified API**: All image operations through one interface with proper client/server separation
- **Type Safety**: Strong TypeScript types for different image types
- **Generalized Design**: Supports current and future image features
- **Better Error Handling**: Consistent error messages and handling
- **Service Architecture**: Clean separation of concerns with client-safe and server-only modules
- **Performance Optimized**: Built-in Cloudinary optimizations
- **Next.js Compatible**: Proper separation prevents Node.js module conflicts in client components

## Architecture: Client/Server Separation

### Why Split?

Next.js requires careful separation of client and server code. The Cloudinary SDK uses Node.js modules (`fs`, `path`) that cannot be imported in browser/client components. Our solution:

- **`image-utils-client.ts`** - Client-safe utilities (validation, URL generation, cropping)
- **`image-utils-server.ts`** - Server-only operations (Cloudinary uploads, file system operations)

### Usage Guidelines:

| Context           | Use                     | Import From                |
| ----------------- | ----------------------- | -------------------------- |
| React Components  | Client utilities        | `@/lib/image-utils-client` |
| Custom Hooks      | Client utilities        | `@/lib/image-utils-client` |
| Server Actions    | Server operations       | `@/lib/image-utils-server` |
| API Routes        | Server operations       | `@/lib/image-utils-server` |
| Server Components | Both (separate imports) | Both files                 |

## Migration Steps

### 1. Update Imports

**Before:**

```typescript
import { uploadImageToCloudinary } from '@/lib/actions/uploud-image-cloudinary';
import { deleteCloudinaryByStorageKey } from '@/lib/actions/uploud-image-cloudinary';
import { formatFileSize } from '@/lib/utils/file';
import { cropImageToBlob } from '@/lib/utils/image-cropping';
import { resolveImageUrl } from '@/lib/utils/reasolve-image-url';
import { cldUrl } from '@/lib/cloudinary';
```

**After:**

```typescript
// For client components (React components, hooks, etc.)
import {
  validateImageFile,
  formatFileSize,
  cropImageToBlob,
  resolveImageUrl,
  generateCloudinaryUrl,
  createImageSchema,
  IMAGE_TYPE_CONFIGS,
  type ImageType,
  type CropArea,
} from '@/lib/image-utils-client';

// For server actions, API routes, and server components
import {
  uploadImageToCloudinary,
  deleteCloudinaryImage,
  AvatarService,
  ImageService,
  CoverPhotoService,
  GalleryService,
} from '@/lib/image-utils-server';
```

### 2. Update Function Calls

**Before:**

```typescript
// Upload image
const result = await uploadImageToCloudinary(file, userId);

// Delete image
await deleteCloudinaryByStorageKey(storageKey);

// Resolve URL
const url = resolveImageUrl(image, 256);
```

**After:**

```typescript
// Client-side validation and URL generation
const isValid = validateImageFile(file, 'avatar'); // Client-side
const url = resolveImageUrl(image, { width: 256 }); // Client-side

// Server-side upload and deletion (in server actions/API routes)
const result = await uploadImageToCloudinary(file, userId, 'avatar'); // Server-side
await deleteCloudinaryImage(storageKey); // Server-side
```

### 3. Use Specialized Services

**Before:**

```typescript
// Manual avatar upload workflow
const validation = Step4Schema.safeParse({ profilePic: file });
if (!validation.success) return { error: validation.error };

const uploadResult = await uploadImageToCloudinary(file, userId);
if (currentImage) {
  await deleteCloudinaryByStorageKey(currentImage);
}
```

**After:**

```typescript
// Simplified avatar service (server actions only)
// In a server action file:
const result = await AvatarService.updateAvatar(file, userId, currentStorageKey);
if (result.success) {
  // Handle success
} else {
  // Handle error: result.error
}

// Client-side validation before calling server action:
const validation = validateImageFile(file, 'avatar');
if (!validation.success) {
  return { error: validation.error };
}
```

### 4. Update Schemas

**Before:**

```typescript
import { Step4Schema } from '@/lib/schemas/complete-profile-schema';
const validation = Step4Schema.safeParse({ profilePic: file });
```

**After:**

```typescript
// Client-side schema validation
import { createImageSchema } from '@/lib/image-utils-client';
const schema = createImageSchema('avatar');
const validation = schema.safeParse(file);

// Or direct validation
import { validateImageFile } from '@/lib/image-utils-client';
const result = validateImageFile(file, 'avatar');
```

### 5. Update Service Classes

**Profile Picture Service** - Replace with AvatarService:

**Before:**

```typescript
import { ProfilePictureService } from '@/lib/services/profile-picture';
const result = await ProfilePictureService.updateProfilePicture(userId, file);
```

**After:**

```typescript
import { AvatarService } from '@/lib/image-utils';
const result = await AvatarService.updateAvatar(file, userId, currentStorageKey);
```

## New Features Available

### 1. Multiple Image Types

```typescript
// Different image types with specific validation
await uploadImageToCloudinary(file, userId, 'avatar'); // Profile pictures
await uploadImageToCloudinary(file, userId, 'cover'); // Cover photos
await uploadImageToCloudinary(file, userId, 'gallery'); // Gallery images
await uploadImageToCloudinary(file, userId, 'content'); // Blog/article images
```

### 2. Advanced URL Generation

```typescript
// Responsive images
const urls = generateResponsiveUrls(publicId, 800);
// { small: "...", medium: "...", large: "...", xlarge: "..." }

// Optimized URLs for specific types
const avatarUrl = AvatarService.getAvatarUrl(storageKey, 128);
const coverUrl = CoverPhotoService.getCoverPhotoUrl(storageKey);

// Custom transformations
const url = generateCloudinaryUrl(publicId, {
  width: 400,
  height: 300,
  crop: 'fill',
  gravity: 'face',
  quality: 'auto',
});
```

### 3. Batch Operations

```typescript
// Upload multiple images at once
const result = await GalleryService.addGalleryImages(files, userId);

// Bulk delete
await bulkDeleteCloudinaryImages(storageKeys);
```

### 4. Enhanced Error Handling

```typescript
import { IMAGE_ERROR_MESSAGES } from '@/lib/image-utils';

const result = await AvatarService.updateAvatar(file, userId);
if (!result.success) {
  console.error(result.error); // Detailed error message
}
```

## File Replacement Strategy

### Files to Eventually Remove:

1. `src/lib/actions/uploud-image-cloudinary.ts` → Functions moved to `image-utils-server.ts`
2. `src/lib/services/profile-picture.ts` → Use `AvatarService` from `image-utils-server.ts`
3. `src/lib/services/complete-profile-picture.ts` → Use `AvatarService` from `image-utils-server.ts`
4. `src/lib/utils/file.ts` → Functions moved to `image-utils-client.ts`
5. `src/lib/utils/image-cropping.ts` → Functions moved to `image-utils-client.ts`
6. `src/lib/utils/reasolve-image-url.ts` → Functions moved to `image-utils-client.ts`
7. `src/lib/cloudinary.ts` → Client functions moved to `image-utils-client.ts`, server functions to `image-utils-server.ts`
8. `src/lib/image-utils.ts` → Split into client and server modules for Next.js compatibility

### Gradual Migration Approach:

1. **Phase 1**: Update imports to use new functions (backward compatible)
2. **Phase 2**: Replace service calls with new services
3. **Phase 3**: Update schemas and validation
4. **Phase 4**: Remove old files once all references updated

## Common Migration Pitfalls

### ❌ Don't Import Server Modules in Client Components

```typescript
// ❌ WRONG - This will cause build errors
import { AvatarService } from '@/lib/image-utils-server'; // Server-only!

function ClientComponent() {
  // This breaks because AvatarService uses Node.js modules
}
```

### ✅ Correct Approach

```typescript
// ✅ CORRECT - Client component using client-safe utilities
import { validateImageFile, resolveImageUrl } from '@/lib/image-utils-client';

function ClientComponent() {
  // Validate on client, upload via server action
  const isValid = validateImageFile(file, 'avatar');
  if (isValid.success) {
    // Call server action that uses AvatarService
    await uploadAvatarAction(file);
  }
}
```

### ✅ Server Action Implementation

```typescript
// In server action file
'use server';
import { AvatarService } from '@/lib/image-utils-server';

export async function uploadAvatarAction(file: File) {
  return await AvatarService.updateAvatar(file, userId, currentKey);
}
```

## Component Updates

### Avatar Components

**AvatarCropper Component:**

```typescript
// Update imports - CLIENT SIDE ONLY
import {
  cropImageToBlob,
  createImageSchema,
  resolveImageUrl,
  validateImageFile,
  type CropArea,
} from '@/lib/image-utils-client';

// Replace validation (client-side)
const validation = createImageSchema('avatar').safeParse(file);
// OR
const isValid = validateImageFile(file, 'avatar');
```

**Complete Profile Components:**

```typescript
// Client component
import { validateImageFile } from '@/lib/image-utils-client';
import { uploadAvatarAction } from '@/lib/actions/avatar';

const handleUpload = async (file: File) => {
  // Validate on client
  const validation = validateImageFile(file, 'avatar');
  if (!validation.success) {
    setError(validation.error);
    return;
  }

  // Upload via server action
  const result = await uploadAvatarAction(file);
  // Handle result...
};
```

```typescript
// Server action file (separate file)
'use server';
import { AvatarService } from '@/lib/image-utils-server';

export async function uploadAvatarAction(file: File) {
  return await AvatarService.updateAvatar(file, userId, currentKey);
}
```

## Benefits After Migration

1. **Single Source of Truth**: All image logic in one place
2. **Type Safety**: Better TypeScript support
3. **Consistency**: Uniform error handling and API
4. **Extensibility**: Easy to add new image types
5. **Performance**: Built-in optimizations
6. **Maintainability**: Easier to update and debug

## Testing the Migration

1. Run `npm run typecheck` to verify TypeScript compatibility
2. Test existing image upload flows
3. Verify URL generation works correctly
4. Check error handling scenarios
5. Test different image types and sizes

## Future Enhancements

The new system is designed to easily support:

- Image compression and optimization
- Multiple upload providers (not just Cloudinary)
- Image watermarking and overlays
- Advanced cropping and filters
- Automatic thumbnail generation
- Progressive image loading
- Image CDN management
