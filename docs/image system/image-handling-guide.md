# Step-by-Step Image Implementation Guide

## Overview

This guide provides a complete walkthrough for implementing image upload functionality using our unified image architecture. Follow these steps to add secure, validated image uploads to any part of your application.

## Prerequisites

- Unified image architecture is already set up (`image-utils-client.ts`, `image-utils-server.ts`, `storage/`)
- Environment variables configured (Cloudinary credentials)
- Database schema includes fields for storing image metadata

## Implementation Steps

### Step 1: Choose Your Image Type

First, determine which image type fits your use case from our supported types:

```typescript
// Available image types in IMAGE_TYPE_CONFIGS
type ImageType =
  | 'avatar' // Profile pictures (6MB, 256x256, 1:1 ratio)
  | 'cover' // Cover photos (10MB, 1200x400, 3:1 ratio)
  | 'gallery' // Gallery images (15MB, variable dimensions)
  | 'thumbnail' // Thumbnails (2MB, 150x150)
  | 'content' // Blog/article images (8MB, variable)
  | 'background' // Background images (20MB, 1920x1080)
  | 'icon' // Icons/logos (1MB, 64x64)
  | 'banner' // Banner images (12MB, 1200x300, 4:1 ratio)
  | 'verification'; // Verification images (8MB, images only)
```

**Example:** For product images, you might use `'gallery'` type.

### Step 2: Client-Side Validation Component

Create a component that validates files before upload:

```typescript
// components/product-image-upload.tsx
'use client';

import { validateImageFile, cropImageToBlob, type CropArea } from '@/lib/image-utils-client';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ProductImageUploadProps {
  onImageSelected: (file: File) => void;
  imageType: 'gallery'; // Your chosen image type
}

export function ProductImageUpload({ onImageSelected, imageType }: ProductImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Step 2.1: Validate using unified system
    const validation = validateImageFile(file, imageType);
    if (!validation.success) {
      toast.error(validation.error);
      return;
    }

    // Step 2.2: File is valid, proceed
    setSelectedFile(file);
    onImageSelected(file);
  }, [imageType, onImageSelected]);

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif" // Match your image type's allowlist
        onChange={handleFileSelect}
        className="block w-full"
      />

      {selectedFile && (
        <div className="text-sm text-green-600">
          ✅ {selectedFile.name} - Valid {imageType} image
        </div>
      )}
    </div>
  );
}
```

### Step 3: Optional - Add Cropping Support

If your image type needs specific dimensions, add cropping:

```typescript
// Enhanced component with cropping
import { Cropper, CropperCropArea, CropperImage } from '@/components/ui/cropper';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function ProductImageUploadWithCrop({ onImageSelected, imageType }: ProductImageUploadProps) {
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const cropAreaRef = useRef<CropArea | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate first
    const validation = validateImageFile(file, imageType);
    if (!validation.success) {
      toast.error(validation.error);
      return;
    }

    // Show cropper for images that need specific dimensions
    const url = URL.createObjectURL(file);
    setSelectedImageUrl(url);
    setShowCropper(true);
  }, [imageType]);

  const handleCropConfirm = useCallback(async () => {
    if (!selectedImageUrl || !cropAreaRef.current) return;

    try {
      // Get dimensions from IMAGE_TYPE_CONFIGS for your image type
      const cropped = await cropImageToBlob(
        selectedImageUrl,
        cropAreaRef.current,
        800, // width - adjust for your image type
        600  // height - adjust for your image type
      );

      if (cropped) {
        const file = new File([cropped.blob], 'cropped-image.png', {
          type: cropped.blob.type
        });

        // Re-validate cropped image
        const validation = validateImageFile(file, imageType);
        if (validation.success) {
          onImageSelected(file);
          setShowCropper(false);
        }
      }
    } catch (error) {
      toast.error('Failed to crop image');
    }
  }, [selectedImageUrl, imageType, onImageSelected]);

  return (
    <>
      {/* File input */}
      <input type="file" onChange={handleFileSelect} />

      {/* Cropper dialog */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent>
          {selectedImageUrl && (
            <Cropper
              image={selectedImageUrl}
              aspectRatio={4/3} // Adjust for your image type
              onCropChange={(area) => { cropAreaRef.current = area as CropArea; }}
            >
              <CropperImage />
              <CropperCropArea />
            </Cropper>
          )}
          <button onClick={handleCropConfirm}>Confirm</button>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Step 4: Server Action for Upload

Create a server action that handles the upload securely:

```typescript
// lib/actions/upload-product-image.ts
'use server';

import { requireUser } from '@/lib/auth';
import { ImageService } from '@/lib/image-utils-server';
import { updateProductImage } from '@/lib/dal/product'; // Your DAL function

export type UploadProductImageResult =
  | { ok: true; data: { imageKey: string; url: string } }
  | { ok: false; error: string };

export async function uploadProductImageAction(
  formData: FormData,
  productId: string
): Promise<UploadProductImageResult> {
  try {
    // Step 4.1: Authenticate user
    const user = await requireUser();

    // Step 4.2: Extract and validate file
    const file = formData.get('productImage') as File;
    if (!file || typeof file.arrayBuffer !== 'function') {
      return { ok: false, error: 'No valid file provided' };
    }

    // Step 4.3: Upload using unified image service
    const uploadResult = await ImageService.uploadImage(file, user.id, 'gallery');

    if (!uploadResult.success) {
      return { ok: false, error: uploadResult.error };
    }

    // Step 4.4: Update database
    try {
      await updateProductImage(productId, uploadResult.data.storageKey);
    } catch (error) {
      // Step 4.5: Rollback on database failure
      await ImageService.deleteImage(uploadResult.data.storageKey);
      return { ok: false, error: 'Failed to update product' };
    }

    // Step 4.6: Return success with normalized data
    return {
      ok: true,
      data: {
        imageKey: uploadResult.data.storageKey,
        url: uploadResult.data.secureUrl,
      },
    };
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Upload failed' };
  }
}
```

### Step 5: Database Operations (DAL)

Create clean database functions for your image metadata:

```typescript
// lib/dal/product.ts
import { prisma } from '@/lib/db';

/**
 * Update product with new image key
 */
export async function updateProductImage(productId: string, imageKey: string): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      image: imageKey,
      // Optional: store additional metadata if needed
      imageUpdatedAt: new Date(),
    },
  });
}

/**
 * Get current product image for cleanup
 */
export async function getProductImage(productId: string): Promise<string | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { image: true },
  });

  return product?.image || null;
}

/**
 * Remove product image
 */
export async function removeProductImage(productId: string): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: { image: null },
  });
}
```

### Step 6: Enhanced Server Action with Replace Pattern

For updating existing images (recommended pattern):

```typescript
// Enhanced server action with replace functionality
export async function updateProductImageAction(
  formData: FormData,
  productId: string
): Promise<UploadProductImageResult> {
  try {
    const user = await requireUser();

    const file = formData.get('productImage') as File;
    if (!file || typeof file.arrayBuffer !== 'function') {
      return { ok: false, error: 'No valid file provided' };
    }

    // Step 6.1: Get current image for replacement
    const currentImageKey = await getProductImage(productId);

    // Step 6.2: Use replace pattern for automatic cleanup
    const uploadResult = await ImageService.replaceImage(file, currentImageKey, user.id, 'gallery');

    if (!uploadResult.success) {
      return { ok: false, error: uploadResult.error };
    }

    // Step 6.3: Update database (old image already cleaned up by service)
    try {
      await updateProductImage(productId, uploadResult.data.storageKey);
    } catch (error) {
      // Rollback: delete new image since old one was already removed
      await ImageService.deleteImage(uploadResult.data.storageKey);
      return { ok: false, error: 'Failed to update database' };
    }

    return {
      ok: true,
      data: {
        imageKey: uploadResult.data.storageKey,
        url: uploadResult.data.secureUrl,
      },
    };
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Upload failed' };
  }
}
```

### Step 7: Integrate in Your Page/Component

Put it all together in your React component:

```typescript
// pages/product/[id]/edit.tsx or components/product-edit-form.tsx
'use client';

import { ProductImageUpload } from '@/components/product-image-upload';
import { updateProductImageAction } from '@/lib/actions/upload-product-image';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProductEditForm({ productId, currentImageKey }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [optimisticImageKey, setOptimisticImageKey] = useState(currentImageKey);

  const handleImageSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      // Step 7.1: Create FormData
      const formData = new FormData();
      formData.set('productImage', selectedFile);

      // Step 7.2: Call server action
      const result = await updateProductImageAction(formData, productId);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      // Step 7.3: Update UI optimistically
      setOptimisticImageKey(result.data.imageKey);
      setSelectedFile(null);
      toast.success('Product image updated successfully!');

    } catch (error: any) {
      toast.error(error?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2>Product Image</h2>

      {/* Current image display */}
      {optimisticImageKey && (
        <img
          src={`https://res.cloudinary.com/your-cloud/image/upload/${optimisticImageKey}`}
          alt="Product"
          className="w-64 h-48 object-cover rounded"
        />
      )}

      {/* Upload component */}
      <ProductImageUpload
        onImageSelected={handleImageSelected}
        imageType="gallery"
      />

      {/* Upload button */}
      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {isUploading ? 'Uploading...' : 'Update Image'}
        </button>
      )}
    </div>
  );
}
```

## Advanced Patterns

### Multiple File Upload

For uploading multiple images (e.g., product gallery):

```typescript
// Enhanced component for multiple files
export function ProductGalleryUpload({ productId, onImagesUploaded }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleMultipleUpload = async () => {
    try {
      // Use batch upload from ImageService
      const batchResult = await ImageService.batchUploadImages(
        selectedFiles,
        userId,
        'gallery'
      );

      if (batchResult.success) {
        const imageKeys = batchResult.data.map(result => result.storageKey);
        await updateProductGallery(productId, imageKeys);
        onImagesUploaded(imageKeys);
      }
    } catch (error) {
      toast.error('Batch upload failed');
    }
  };

  return (
    <input
      type="file"
      multiple
      onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
    />
  );
}
```

### Display Images with Optimization

For displaying uploaded images with Cloudinary optimizations:

```typescript
// components/optimized-image.tsx
import { resolveImageUrl, getOptimizedUrl } from '@/lib/image-utils-client';

interface OptimizedImageProps {
  storageKey: string;
  imageType: ImageType;
  alt: string;
  className?: string;
}

export function OptimizedImage({ storageKey, imageType, alt, className }: OptimizedImageProps) {
  // Get optimized URL with type-specific transformations
  const optimizedUrl = getOptimizedUrl(storageKey, imageType);

  if (!optimizedUrl) {
    return <div className="bg-gray-200 flex items-center justify-center">No Image</div>;
  }

  return (
    <img
      src={optimizedUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
```

## Error Handling Best Practices

### Client-Side Error Handling

```typescript
const handleUpload = async () => {
  try {
    // Upload logic
  } catch (error) {
    // Handle different error types
    if (error instanceof Error) {
      if (error.message.includes('File size')) {
        toast.error('File too large. Please choose a smaller image.');
      } else if (error.message.includes('MIME')) {
        toast.error('Unsupported file format. Please use JPG, PNG, or WebP.');
      } else {
        toast.error('Upload failed. Please try again.');
      }
    }
  }
};
```

### Server-Side Error Handling

```typescript
export async function uploadImageAction(formData: FormData) {
  try {
    // Upload logic
  } catch (error: any) {
    // Log detailed error for debugging
    console.error('Image upload error:', {
      error: error?.message,
      stack: error?.stack,
      formDataKeys: Array.from(formData.keys()),
    });

    // Return user-friendly error
    return {
      ok: false,
      error: 'Upload failed. Please check your file and try again.',
    };
  }
}
```

## Testing Your Implementation

### 1. Test Client Validation

```typescript
// Test different file types and sizes
const testFiles = [
  new File([''], 'test.txt', { type: 'text/plain' }), // Should fail
  new File([''], 'huge.jpg', { type: 'image/jpeg' }), // Test size limits
  new File([''], 'valid.png', { type: 'image/png' }), // Should pass
];

testFiles.forEach((file) => {
  const result = validateImageFile(file, 'gallery');
  console.log(`${file.name}: ${result.success ? 'PASS' : result.error}`);
});
```

### 2. Test Server Upload

```typescript
// Create test FormData
const formData = new FormData();
formData.set('image', testFile);

const result = await uploadImageAction(formData);
console.log('Upload result:', result);
```

### 3. Test Database Integration

```typescript
// Verify database updates
const product = await getProductById(testProductId);
console.log('Image key stored:', product.image);
```

## Checklist for New Image Upload Features

When implementing a new image upload feature, verify:

- [ ] ✅ **Image type chosen** from supported types
- [ ] ✅ **Client validation** uses `validateImageFile(file, imageType)`
- [ ] ✅ **Server action** uses appropriate service (`ImageService`, `AvatarService`, etc.)
- [ ] ✅ **Error handling** follows ServiceResult pattern
- [ ] ✅ **Database operations** are clean and separate from image logic
- [ ] ✅ **Cleanup** implemented for failed operations
- [ ] ✅ **Replace pattern** used for updating existing images
- [ ] ✅ **Security** features active (server-side MIME verification)
- [ ] ✅ **User experience** includes loading states and error messages
- [ ] ✅ **Testing** completed for validation, upload, and edge cases

## Summary

This implementation guide ensures that all your image upload features:

1. **Follow consistent patterns** across your application
2. **Use security-first design** with server-side verification
3. **Handle errors gracefully** with user-friendly messages
4. **Maintain clean separation** between UI, business logic, and database operations
5. **Leverage our unified architecture** for maintainability and extensibility

By following this guide, you'll have secure, performant, and maintainable image upload functionality that integrates seamlessly with our unified image architecture.
