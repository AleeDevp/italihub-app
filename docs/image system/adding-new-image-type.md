# Adding a New Image Type

This guide explains, step by step, how to add a new file/image type to the uNoteNo}

````
Notes:

- Cloudinary resource type: Our current uploader uses `resource_type: 'image'` for all image types, providing optimized image processing and security. This ensures consistent behavior across all image uploads.
- Transformations: For types with strict dimensions, the server already applies `fill`/`scale` based on the config. If your type needs different behavior, add type-specific transformation rules where we build `uploadOptions.transformation`.es:

- Cloudinary resource type: Our current uploader uses `resource_type: 'image'` for all image types, providing optimized image processing and security. This ensures consistent behavior across all image uploads.
- Transformations: For types with strict dimensions, the server already applies `fill`/`scale` based on the config. If your type needs different behavior, add type-specific transformation rules where we build `uploadOptions.transformation`.

--- Cloudinary resource type: Our current uploader uses `resource_type: 'image'` for all image types, providing optimized image processing and security. This ensures consistent behavior across all image uploads.
- Transformations: For types with strict dimensions, the server already applies `fill`/`scale` based on the config. If your type needs different behavior, add type-specific transformation rules where we build `uploadOptions.transformation`.

---udinary resource type: Our current uploader uses `resource_type: 'image'` for all image types, providing optimized image processing and security. This ensures consistent behavior across all image uploads.
- Transformations: For types with strict dimensions, the server already applies `fill`/`scale` based on the config. If your type needs different behavior, add type-specific transformation rules where we build `uploadOptions.transformation`.Cloudinary resource type: Our current uploader uses `resource_type: 'image'` for all image types, providing optimized image processing and security. This ensures consistent behavior across all image uploads.

- Cloudinary resource type: Our current uploader uses `resource_type: 'image'` for all image types, providing optimized image processing and security. This ensures consistent behavior across all image uploads.
- Transformations: For types with strict dimensions, the server already applies `fill`/`scale` based on the config. If your type needs different behavior, add type-specific transformation rules where we build `uploadOptions.transformation`.Cloudinary resource type: Our current uploader uses `resource_type: 'image'` for all image types, providing optimized image processing and security. This ensures consistent behavior across all image uploads. Cloudinary resource type: Our current uploader uses `resource_type: 'image'` for all image types, providing optimized image processing and security. This ensures consistent behavior across all image uploads.ied image system (`image-utils-client.ts` + `image-utils-server.ts`). It captures both client and server changes, plus patterns and pitfalls. Use this as a checklist for future types.

## TL;DR checklist

- Define the type name and purpose (e.g., `verification`, `banner`, `icon`, etc.)
- Client: Add config in `IMAGE_TYPE_CONFIGS` and, if needed, update `ImageType` union
- Client: Ensure `validateImageFile` and any UI bits (previews, labels) are covered
- Client: If new MIME types are involved, confirm `detectFileType` mapping supports them
- Server: Create a specialized service by extending `ImageService` with type-specific helpers
- Server: Use Cloudinary `resource_type: 'image'` for all image types
- Documentation: Update README table and (optionally) migration guide
- Tests/Validation: Try client validation + a server upload with small and large files

---

## 1) Define semantics for your type

Answer these before you touch code:

- Name: A descriptive key for the type (e.g., `banner`)
- Use case: Where/how it’s used
- Constraints:
  - Max size (MB)
  - Allowed MIME types (e.g., `image/jpeg`, `image/webp`, `image/avif`)
  - Dimensions and aspect ratio (optional)
  - Quality (number or `auto`)
  - Storage folder (e.g., `banners/`)
- Preview/URL needs: Any special URL defaults or transformations for rendering

---

## 2) Client: Add ImageType and config

File: `src/lib/image-utils-client.ts`

1. Add the literal to `ImageType` if it doesn’t exist yet:

```ts
export type ImageType =
  | 'avatar'
  | 'cover'
  | 'gallery'
  | 'thumbnail'
  | 'content'
  | 'background'
  | 'icon'
  | 'banner'
  | 'verification' // example
  | 'YOUR_NEW_TYPE';
````

2. Add a config in `IMAGE_TYPE_CONFIGS`:

```ts
export const IMAGE_TYPE_CONFIGS: Record<ImageType, ImageTypeConfig> = {
  // ...existing types
  YOUR_NEW_TYPE: {
    maxSizeBytes: 8 * 1024 * 1024, // 8MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    dimensions: { width: 800, height: 600, aspectRatio: '4:3' }, // optional
    quality: 90, // or 'auto'
    folder: 'your-new-type',
  },
};
```

3. Validation is automatic via `validateImageFile(file, 'YOUR_NEW_TYPE')` since it uses the config. Only image MIME types are supported for security and simplicity. The client validator will produce clear error messages.

4. If your type introduces new image MIME types not already covered, check `detectFileType` mapping and extend as needed (e.g., add support for new image formats).

5. URL generation: You can use `getOptimizedUrl(storageKey, 'YOUR_NEW_TYPE')` (which derives defaults from your config) or `generateCloudinaryUrl(publicId, options)` for custom transformations.

---

## 3) Server: Create a specialized service (optional but recommended)

File: `src/lib/image-utils-server.ts`

We recommend creating a focused service that wraps the generic `ImageService` for your new type. Pattern:

```ts
export class YourNewTypeService extends ImageService {
  static async upload(file: File, userId: string): Promise<ServiceResult<ImageUploadResult>> {
    return ImageService.uploadImage(file, userId, 'YOUR_NEW_TYPE');
  }

  static async uploadMany(
    files: File[],
    userId: string
  ): Promise<ServiceResult<ImageUploadResult[]>> {
    return ImageService.batchUploadImages(files, userId, 'YOUR_NEW_TYPE');
  }

  static async replace(
    newFile: File,
    oldStorageKey: string | null,
    userId: string
  ): Promise<ServiceResult<ImageUploadResult>> {
    return ImageService.replaceImage(newFile, oldStorageKey, userId, 'YOUR_NEW_TYPE');
  }
}
```

Notes:

- Cloudinary resource type: Our current uploader uses `resource_type: 'image' for all image types, providing optimized image processing and security.
- Transformations: For types with strict dimensions, the server already applies `fill`/`scale` based on the config. If your type needs different behavior, add type-specific transformation rules where we build `uploadOptions.transformation`.

---

## 4) Wire up client and server usage

Client (validation + optional previews):

```ts
import { validateImageFile, resolveImageUrl } from '@/lib/image-utils-client';

const check = validateImageFile(file, 'YOUR_NEW_TYPE');
if (!check.success) {
  setError(check.error);
  return;
}

// display existing image
const url = resolveImageUrl(existingStorageKey, { width: 800, crop: 'fill' });
```

Server (upload + replace):

```ts
import { YourNewTypeService } from '@/lib/image-utils-server';

// Single upload
const result = await YourNewTypeService.upload(file, userId);
if (!result.success) return { error: result.error };

// Replace existing
const replaced = await YourNewTypeService.replace(file, currentStorageKey, userId);
```

Persistence (DB):

- Save `storageKey`, `mimeType`, and `bytes` to your domain tables.
- For types requiring roles or additional metadata (like verification files), model those fields and pass them from client or derive them server-side.

---

## 5) Extend utilities (optional)

- File classification: If your type needs a classification helper (similar to `classifyVerificationFileRole`), implement it in the client module and ensure it relies on `detectFileType` to avoid MIME duplication.
- URL helpers: If your type will be retrieved often with a standard size/crop, consider adding a tiny helper function for your type (or reuse `getOptimizedUrl`).

---

## 6) Update documentation

- Add a row in the Supported Image Types table in `docs/README-image-system.md`
- If behavior differs significantly (e.g., non-image support), add a short section showing example usage
- If you renamed or added utilities (e.g., `detectFileType`), update `docs/reusable-components-documentation.md` accordingly

---

## 7) Testing checklist

- Client validation rejects disallowed MIME and oversize files
- Upload succeeds for valid files and returns `storageKey`
- Replacing an existing file cleans it up (best-effort deletion)
- Generated URLs display correctly in the UI (check a few sizes)
- Batch upload returns success when all succeed and rolls back if any fail
- Try a couple of slow or large files to observe error messages

---

## Example: Verification (images only)

- Client config allows `image/jpeg`, `image/png`, `image/webp`, and `image/avif`
- Server uses `resource_type: 'image'` for optimized image processing
- Specialized service: `VerificationImageService.uploadVerificationFile` (single file upload)
- Helpers: `detectFileType` and `classifyVerificationFileRole` (IMAGE | DOCUMENT | OTHER)
- Role assignment: Based on verification method (LANDMARK_SELFIE → IMAGE, others → DOCUMENT)

---

## Pitfalls and best practices

- Avoid importing server modules in client components (Next.js constraint)
- Don’t trust file extensions; rely on MIME, and consider server-side content sniffing if you accept non-image types
- Keep transformations conservative for documents (avoid compressing text-heavy images aggressively)
- Use folders per type to keep Cloudinary public IDs organized
- Clean up old images on replace; treat delete as best-effort (don’t fail user flow on cleanup)
- Prefer adding a specialized service for frequently used types to avoid repeating the type argument

---

## Suggestions for evolving the architecture

These are optional improvements you can adopt over time:

1. Resource type strategy

- Use `resource_type: 'image'` consistently for all image types, providing optimized processing and better security.

2. Server-side MIME verification

- For higher security, add server-side file-type detection (magic number sniffing) using a library like `file-type` to guard against spoofed MIME types.

3. Image optimization and previews

- Consider generating optimized thumbnails and responsive sizes for better performance and user experience.

4. Provider abstraction

- If multi-provider support is a goal, wrap Cloudinary calls behind a minimal interface so adding S3 or others is straightforward.

5. Deduplication and naming

- Optionally derive a content hash and use it in the public ID to deduplicate uploads and make re-uploads idempotent.

6. Access control and signing

- If some assets should be private, add a server endpoint that returns signed URLs (short TTL) and ensure clients never store raw public IDs for private content.

7. Observability

- Add structured logging around upload/delete with timings and error codes; consider metrics for retries and failure rates.

8. Testing

- Add small unit tests for helpers (`detectFileType`, classifiers) and a minimal integration test that mocks Cloudinary responses.
