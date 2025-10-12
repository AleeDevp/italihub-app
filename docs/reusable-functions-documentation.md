# ItaliaHub Reusable Components Documentation

This document provides a comprehensive overview of all reusable functions, services, DAL functions, hooks, utilities, and authentication methods available in the ItaliaHub application.

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Data Access Layer (DAL)](#data-access-layer-dal)
3. [Server Actions](#server-actions)
4. [Image Processing & Storage](#image-processing--storage)
5. [Audit System](#audit-system)
6. [Client-Side Hooks](#client-side-hooks)
7. [Utility Functions](#utility-functions)
8. [Zod Validation Schemas](#zod-validation-schemas)
9. [Type Definitions](#type-definitions)
10. [Context Providers](#context-providers)
11. [Cache Layer](#cache-layer)
12. [Email Services](#email-services)
13. [Metadata Utilities](#metadata-utilities)
14. [Prisma Enums (server + client)](#prisma-enums-server--client)

---

## Authentication System

### Core Authentication (`/src/lib/auth.ts`)

The application uses **Better Auth** for authentication with PostgreSQL and Prisma adapter, including email verification, password reset, and Google OAuth integration.

#### Configuration:

- Email/password authentication with verification
- Google OAuth integration
- PostgreSQL database with Prisma adapter
- Custom user schema extensions
- Database hooks for user creation and session management

Key features in our setup:

- Account linking enabled (Google) with trustedProviders and updateUserInfoOnLink
- Email verification sent on sign up, auto sign-in after verification
- Password reset emails via Resend with audit logs

### Server-Side Authentication Functions (`/src/lib/require-user.ts`)

```typescript
import { getCurrentUser, requireUser } from '@/lib/auth';
```

- **`getCurrentUser()`**: Returns the current authenticated user or `null`
  - **Use Case**: Optional authentication checks
  - **Return Type**: `Promise<User | null>`
  - **Caching**: Memoized per-request using React cache
  - **Example**: Used in layouts where authentication is optional

- **`requireUser()`**: Ensures user is authenticated, throws 401 error if not
  - **Use Case**: Protected routes and server actions
  - **Return Type**: `Promise<User>` (guaranteed)
  - **Caching**: Memoized per-request to avoid duplicate lookups
  - **Example**: Used in dashboard pages and profile actions

#### Extended User Schema:

```typescript
// User fields available from Better Auth
interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  image: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isProfileComplete: boolean;
  userId: string | null;
  telegramHandle: string | null;
  cityId: number | null;
  cityLastChangedAt: Date | null;
  verified: boolean;
  verifiedAt: Date | null;
}
```

### Client-Side Authentication (`/src/lib/auth-client.ts`)

```typescript
import { signUp, signIn, signOut, useSession, linkSocial, authClient } from '@/lib/auth-client';
```

- **`useSession()`**: React hook for getting current user data in client components
  - **Use Case**: Client-side user data access, conditional rendering
  - **Return Type**: `{ user: User | null, session: Session | null }`
  - **Real-time**: Updates automatically when authentication state changes

- **`signIn(credentials)`**: Sign in with email/password
  - **Parameters**: `{ email: string, password: string }`
  - **Use Case**: Login forms

- **`signUp(credentials)`**: Register new user
  - **Parameters**: `{ email: string, password: string, name: string }`
  - **Use Case**: Registration forms

- **`signOut()`**: Sign out current user
  - **Use Case**: Logout functionality

- **`linkSocial()` / `linkSocialAccount()`**: Link social accounts
  - Client: `linkSocial` from authClient
  - Server action helper: `linkSocialAccount()` in `auth-actions.ts` (links Google)

### Session Management (`/src/lib/get-session.ts`)

```typescript
import { getServerSession } from '@/lib/get-session';
```

- **`getServerSession()`**: Server-side session retrieval
  - **Use Case**: Getting session in layouts and server components
  - **Return Type**: `Promise<Session | null>`
  - **Caching**: Cached per-request for performance
  - Note: Used internally by `requireUser`/`getCurrentUser` and audit context

---

## Data Access Layer (DAL)

All database operations are abstracted into DAL functions. **Note**: User authentication should use Better Auth functions (`getCurrentUser`/`requireUser`) - DAL functions handle profile data operations.

### User Operations (`/src/lib/dal/user.ts`)

#### UserId Validation & Management:

```typescript
import {
  normalizeUserId,
  isValidUserIdFormat,
  isUserIdAvailable,
  RESERVED_USER_IDS,
} from '@/lib/dal/user';
```

- **`normalizeUserId(userId: string)`**: Normalizes userId (trim, lowercase, NFC)
  - **Use Case**: Consistent userId formatting before validation or storage
  - **Return Type**: `string`

- **`isValidUserIdFormat(userId: string)`**: Validates userId format using Zod schema
  - **Use Case**: Format validation before availability checks
  - **Return Type**: `boolean`
  - **Rules**: Uses CompleteProfileSchema validation (4-10 characters, alphanumeric + underscore)

- **`isUserIdAvailable(userId, currentUserId?)`**: Comprehensive availability check
  - **Parameters**: `userId: string, currentUserId?: string`
  - **Return Type**: `Promise<{ available: boolean; reason?: 'invalid' | 'reserved' | 'taken' }>`
  - **Features**: Format validation, reserved ID checking, database uniqueness
  - **Use Case**: Real-time availability checking in profile forms

- **`RESERVED_USER_IDS`**: Array of system-reserved userIds
  - **Items**: `'admin', 'api', 'dashboard', 'support', 'italihub'`, etc.
  - **Use Case**: Preventing conflicts with application routes and features

#### Profile Data Operations:

```typescript
import { updateProfileBasics, getUserProfileData, changeCity } from '@/lib/dal/user';
```

- **`updateProfileBasics(userId, data)`**: Updates core profile fields
  - **Parameters**: `userId: string, data: { name: string, userId: string, telegram: string }`
  - **Use Case**: Profile editing in dashboard
  - **Validation**: Uses dashboard schemas for data validation

- **`getUserProfileData(userId)`**: Gets extended profile with city information
  - **Return Type**: Profile data with city name, verification status, and timestamps
  - **Use Case**: Loading profile data for editing forms
  - **Features**: Includes city relationship and verification details

- **`changeCity(userId, newCityId)`**: Changes user city with business rules
  - **Parameters**: `userId: string, newCityId: number`
  - **Return Type**: `Promise<{ revokedVerification: boolean }>`
  - **Business Rules**: 10-day cooldown period, verification revocation
  - **Use Case**: City selection in profile settings

- Profile picture helpers:
  - **`updateUserProfilePicture(userId, imageKey)`**: Set new image key on user
  - **`getUserProfilePicture(userId)`**: Get current image key for cleanup
  - **`deleteUserProfilePicture(userId)`**: Remove current image key (DB only)

- Admin role helpers:
  - **`assignUserRole(targetUserId, newRole, adminUserId, adminRole?)`**
  - **`revokeUserRole(targetUserId, adminUserId, adminRole?)`**

### Other DAL Operations

Note: There is no separate Cities DAL module; server-side city caching is provided via `lib/cache/city-cache.ts` (see Cache Layer).

#### Verification Operations (`/src/lib/dal/verification.ts`)

Key functions:

- **`getLatestVerification(userId)`**: Fetch user's latest request (status/method/city)
- **`submitVerificationRequest(userId, { method, userNote?, files })`**: Create request with files
- **`getVerificationById(requestId, accessorUserId?)`**: Get request with files
- **`getVerificationFiles(requestId)`**: List files for a request
- **`addVerificationFile(requestId, actorUserId, file)`**: Add file to pending request
- **`removeVerificationFile(fileId, actorUserId)`**: Remove file from pending request (returns storageKey for cleanup)
- **`getUserVerificationHistory(userId)`**: History list with counts
- **`getVerificationStorageKey(verificationId)`**: First file storage key
- **`revokeUserVerification(userId, revokerUserId, reason?, role?)`**: Admin revoke

#### Notification Operations (`/src/lib/dal/notifications.ts`)

Exports:

- **`getUnreadCount(userId)`**: Count unread
- **`listNotifications(userId, { page?, pageSize? }?)`**: Paginated list
- **`markRead(userId, id)`**: Mark one as read
- **`markAllRead(userId)`**: Mark all as read

#### Advertisement Operations (`/src/lib/dal/ads.ts`)

Exports:

- **`getUserAdStats(userId)`**: Aggregate counts (mocked for now)
- **`listUserAds(params: UserAdListParams)`**: Paginated list (temporary mock data)
- **`getAdForOwner(adId, userId)`**: Fetch ad with ownership check and child details
- **`deleteAd(adId, userId)`**: Delete with ownership check

#### Metrics & Analytics Operations (`/src/lib/dal/metrics.ts`)

Exports:

- **`getOnlineAdsWithCounters(userId)`**: Top ONLINE ads with view/click counters

#### Announcement Operations (`/src/lib/dal/announcements.ts`)

Exports:

- **`listActiveAnnouncementsForUser(userId)`**: Active announcements not yet dismissed
- **`dismissAnnouncement(userId, announcementId)`**: Mark as read/dismissed

#### Activity Tracking (`/src/lib/dal/activity.ts`)

Current export:

- **`listRecentUserActivity(userId, limit?)`**: Returns mock data pending schema alignment

#### Moderator Verification DAL (`/src/lib/dal/moderator-verification.ts`)

- Listing/searching:
  - **`getVerificationRequestsForModerators(params, accessorUserId, accessorRole?)`**
  - **`getVerificationRequestById(requestId, accessorUserId, accessorRole?)`**
  - **`getVerificationStats()`**: Aggregate stats (totals, top reasons, city stats, avg processing time)
- Actions:
  - **`moderatorApproveVerification(requestId, moderatorUserId, role?)`**: Approve and mark user verified
  - **`moderatorRejectVerification(requestId, moderatorUserId, { rejectionCode?, rejectionNote? }, role?)`**
  - **`bulkApproveVerifications(requestIds, moderatorUserId, role?)`** → `{ successful, failed[] }`
  - **`bulkRejectVerifications(requestIds, moderatorUserId, { rejectionCode?, rejectionNote? }, role?)`** → `{ successful, failed[] }`

---

## Server Actions

Server actions handle form submissions and mutations with comprehensive error handling.

### Profile Picture Actions (`/src/lib/actions/update-profile-picture.ts`)

```typescript
import { updateProfilePictureAction } from '@/lib/actions/update-profile-picture';
```

- **`updateProfilePictureAction(formData)`**: Complete profile picture update workflow
  - **Parameters**: `formData: FormData` containing 'profilePic' file
  - **Return Type**: `Promise<UpdateProfilePictureResult>`
  - **Features**:
    - Authentication via `requireUser()`
    - File validation and processing via `AvatarService`
    - Database integration via DAL functions
    - Automatic cleanup of previous images
    - Rollback handling on failures
  - **Use Case**: Dashboard profile picture uploads

### Complete Profile Actions (`/src/lib/actions/complete-profile.ts`)

```typescript
import { completeProfileAction } from '@/lib/actions/complete-profile';
```

- **`completeProfileAction(values)`**: Handles initial profile completion
  - **Features**: Multi-step profile setup with image upload
  - **Integration**: Uses unified image utilities for avatar processing
  - **Validation**: Comprehensive form validation with Zod schemas

### Authentication Actions (`/src/lib/actions/auth-actions.ts`)

Exports:

- **`signUp(email, password, name)`**: Email/password signup (with verification)
- **`signIn(email, password)`**: Email/password sign-in
- **`signInSocial(provider)`**: Initiate OAuth (e.g., Google)
- **`signOut()`**: End current session
- **`linkSocialAccount()`**: Link Google account for current user
- **`getAccountInfo(accountId)`**: Fetch linked account info

### Verification Actions (`/src/lib/actions/verification-actions.ts`)

- **`uploadVerificationFileAction(formData, requestId?)`**
  - Validates and uploads a single verification image using the unified image service, optionally attaches it to an existing pending request.
  - Returns `{ ok: true, data: { fileId, storageKey } } | { ok: false, error }`.
- **`submitVerificationRequestAction({ method, userNote?, files })`**
  - Submits a new verification request with previously uploaded files (by storageKey).
- **`removeVerificationFileAction(fileId)`**
  - Removes a file from a pending request and deletes it from storage.

---

## Image Processing & Storage

Comprehensive unified image architecture with client/server separation, type-safe operations, and security-first design.

### Architecture Overview

The unified image system provides:

- **Type-Safe Operations**: 9 predefined image types with specific constraints and optimizations
- **Security-First Design**: Server-side MIME verification using `file-type` library
- **Content-Hash Naming**: Automatic deduplication and integrity verification
- **Provider Abstraction**: Clean separation between storage logic and business logic
- **Comprehensive Error Handling**: Consistent `ServiceResult` pattern across all operations
- **Automatic Cleanup**: Robust rollback mechanisms for failed operations

**📋 Implementation Guide**: For step-by-step instructions on adding new image upload features, see [`docs/image system/README-image-system.md`](./image%20system/README-image-system.md).

### Key Benefits:

- **Consistency**: All image uploads follow the same patterns and validation rules
- **Security**: Server-side validation prevents malicious file uploads
- **Performance**: Type-specific optimizations and Cloudinary integration
- **Maintainability**: Centralized configuration and reusable service classes
- **Developer Experience**: Type safety and comprehensive error messages

### Client-Side Image Utilities (`/src/lib/image-utils-client.ts`)

Browser-safe image utilities that can be used in React components without Node.js dependencies.

```typescript
import {
  validateImageFile,
  generateCloudinaryUrl,
  resolveImageUrl,
  getOptimizedUrl,
  generateResponsiveUrls,
  cropImageToBlob,
  resizeImageToBlob,
  formatFileSize,
  detectFileType,
  classifyVerificationFileRole,
  handleServiceError,
  serviceToActionResult,
  IMAGE_TYPE_CONFIGS,
  IMAGE_ERROR_MESSAGES,
  type ImageType,
  type ImageTypeConfig,
  type CropArea,
  type FileMetadata,
  type FileWithPreview,
  type ServiceResult,
  type ActionResult,
} from '@/lib/image-utils-client';
```

#### Core Validation & Processing:

- **`validateImageFile(file, imageType)`**: Validates files against image type constraints
  - **Parameters**: `file: File, imageType: ImageType`
  - **Return Type**: `ServiceResult<void>`
  - **Use Case**: Client-side file validation before upload
  - **Features**: Size limits, MIME type checking, format validation
  - **Integration**: Used by file upload hook and components

- **`cropImageToBlob(imageUrl, area, outputWidth, outputHeight)`**: Client-side image cropping
  - **Parameters**: `imageUrl: string, area: CropArea, outputWidth: number, outputHeight: number`
  - **Return Type**: `Promise<{ blob: Blob; url: string } | null>`
  - **Use Case**: Avatar cropping, image editing in browser
  - **Features**: Canvas-based processing, maintains quality, creates uploadable blob

#### URL Generation & Optimization:

- **`resolveImageUrl(image, options?)`**: Smart URL resolution
  - **Parameters**: `image?: string | null`, `options?: ImageProcessingOptions`
  - **Return**: `string | null`
  - **Notes**: Accepts full URLs, blob URLs, public paths, or Cloudinary storage keys

- **`generateCloudinaryUrl(publicId, options?)`**: Generate optimized Cloudinary URLs
  - **Features**: Type-specific optimization, responsive image generation
  - **Use Case**: Custom image transformations

- **`getOptimizedUrl(storageKey, imageType)`**: Get optimized URL for image type
  - **Use Case**: Standard optimized images for UI components

- **`generateResponsiveUrls(publicId, baseWidth?)`**: Small/medium/large/xlarge URLs

- **`resizeImageToBlob(imageUrl, maxWidth, maxHeight, quality?)`**: Client-side resize

#### Utilities:

- **`formatFileSize(bytes, decimals?)`**: Human-readable file size formatting
  - **Parameters**: `bytes: number, decimals?: number`
  - **Return Type**: `string`
  - **Example**: `formatFileSize(1024)` → `"1 KB"`

- **`detectFileType(file)`**: Detect image file type from MIME (jpg, png, webp, avif, etc.)
  - **Use Case**: Auto-categorization of uploaded images

#### Configuration & Types:

- **`IMAGE_TYPE_CONFIGS`**: Complete configuration for all image types
  - **Types**: `avatar`, `cover`, `gallery`, `thumbnail`, `content`, `background`, `icon`, `banner`, `verification`
  - **Properties**: `maxSizeBytes`, `allowedMimeTypes`, `dimensions`, `quality`, `folder`
  - **Special Cases**:
    - **`verification`**: Supports only images (8MB limit, no forced dimensions, single file upload)
    - **`avatar`**: Square 1:1 ratio with 256x256 optimization
    - **`cover`**: Wide 3:1 ratio for profile covers
    - **`banner`**: Wide 4:1 ratio for promotional content

- **`IMAGE_ERROR_MESSAGES`**: Standardized error messages for consistent UX
- **Type Definitions**: `ImageType`, `CropArea`, `FileMetadata`, `FileWithPreview`

#### Result Handling:

- **`ServiceResult<T>`** & **`ActionResult<T>`**: Standardized result types
- **`handleServiceError(error, defaultMessage)`**: Consistent error handling
- **`serviceToActionResult(result)`**: Convert between result types

### Server-Side Image Operations (`/src/lib/image-utils-server.ts`)

Server-only operations using Cloudinary SDK and Node.js modules.

```typescript
import {
  uploadImageToCloudinary,
  deleteCloudinaryImage,
  bulkDeleteCloudinaryImages,
  getSignedUrl,
  buildPublicId,
  toDbFileRecord,
  mimeFromStorageKey,
  ImageService,
  AvatarService,
  CoverPhotoService,
  GalleryService,
  ContentImageService,
  VerificationImageService,
  type ImageUploadResult,
} from '@/lib/image-utils-server';
```

#### Core Upload Operations:

- **`uploadImageToCloudinary(file, userId, imageType)`**: Upload file to Cloudinary
  - **Returns**: `Promise<ImageUploadResult>` (throws on error). Prefer using `ImageService.uploadImage` for a `ServiceResult` wrapper.

#### Cleanup Operations:

- **`deleteCloudinaryImage(storageKey)`**: Delete single image from Cloudinary
  - **Parameters**: `storageKey: string`
  - **Features**: Safe deletion with error handling
  - **Use Case**: Image replacement and cleanup

- **`bulkDeleteCloudinaryImages(storageKeys)`**: Efficient bulk deletion
  - **Parameters**: `storageKeys: string[]`
  - **Use Case**: Mass cleanup operations

- Helpers:
  - **`getSignedUrl(storageKey, { resourceType? })`**: Signed delivery URL (if configured)
  - **`buildPublicId(folder, userId, hash, uniqueId)`**: Compose publicId
  - **`toDbFileRecord(upload)`**: `{ storageKey, mimeType, bytes }`
  - **`mimeFromStorageKey(storageKey)`**: Derive MIME from extension

#### Specialized Services:

- **`ImageService`**: Base class for all image operations
  - **Methods**:
    - **`uploadImage(file, userId, imageType)`**: Upload single image with validation
    - **`replaceImage(file, currentKey, userId, imageType)`**: Replace existing image with cleanup
    - **`deleteImage(storageKey)`**: Delete single image safely
    - **`batchUploadImages(files, userId, imageType)`**: Upload multiple images efficiently
  - **Features**:
    - **Server-side MIME verification** using `file-type` library for security
    - **Content-hash naming** for deduplication and integrity
    - **Automatic cleanup** on failures with rollback capabilities
    - **Consistent error handling** with ServiceResult pattern
    - **Retry logic** for robust upload operations

- **`AvatarService`**: Profile picture management
  - **Methods**: `updateAvatar()`, `deleteAvatar()`
  - **Features**: Database integration, cleanup handling
  - **Use Case**: Complete avatar workflow

- **Service Classes**: `CoverPhotoService`, `GalleryService`, `ContentImageService`, `VerificationImageService`
  - **Features**: Type-specific optimizations and constraints
  - **Use Case**: Specialized image handling workflows

### Storage Provider Abstraction (`/src/lib/storage`)

- **`getStorageProvider()`**: Resolves provider by `STORAGE_PROVIDER` (default Cloudinary)
- Cloudinary implementation (`cloudinary-provider.ts`):
  - **`uploadBuffer`**, **`deleteByStorageKey`**, **`deleteManyByStorageKeys`**
  - Optional helpers: **`getPreviewUrl(publicId, { width?, page? })`**, **`getSignedUrl(storageKey, { resourceType? })`**

---

## Client-Side Hooks

### UserId Management Hooks (`/src/hooks/use-userid-availability.ts`)

```typescript
import { useUserIdAvailability } from '@/hooks/use-userid-availability';
```

#### UserId Availability Checking:

Hook signature: `useUserIdAvailability(currentUserId?)`

Returns: `{ status, message, check }` where `status` ∈ `'idle'|'checking'|'available'|'taken'|'invalid'|'reserved'|'error'` and `check(userId: string)` debounces and hits `/api/users/availability`.

Client-side format validation is performed using `CompleteProfileSchema.shape.userId` prior to network calls.

Note: `use-userid-validation.ts` is currently commented out; format checks are handled inside `useUserIdAvailability` using Zod.

### File Upload Hook (`/src/hooks/use-file-upload.ts`)

Enhanced file upload hook with unified image validation system integration and comprehensive drag-and-drop support.

```typescript
import { useFileUpload, type FileUploadOptions } from '@/hooks/use-file-upload';
import type { ImageType, FileWithPreview } from '@/lib/image-utils-client';

// Recommended approach with imageType
const [state, actions] = useFileUpload({
  imageType: 'avatar', // Uses unified validation system
  multiple: false,
  onFilesAdded: (files: FileWithPreview[]) => {
    // Handle uploaded files with automatic validation
  },
});
```

#### Options:

- **`imageType?: ImageType`**: Use unified image validation system
  - **Values**: All supported image types from configuration
  - **Benefits**: Automatic validation, consistent error handling, type-specific constraints
  - **Use Case**: All image upload implementations

- **`multiple?: boolean`**: Allow multiple file selection (default: `false`)
- **`maxFiles?: number`**: Maximum files when multiple is enabled
- **`initialFiles?: FileMetadata[]`**: Pre-populate with existing files
- **`onFilesChange?: (files) => void`**: Called when file list changes
- **`onFilesAdded?: (files) => void`**: Called when new files are added

#### State & Actions:

```typescript
// State
const { files, isDragging, errors } = state;

// Actions
const {
  addFiles,
  removeFile,
  clearFiles,
  clearErrors,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleFileChange,
  openFileDialog,
  getInputProps,
} = actions;
```

#### Key Features:

- **Enhanced Validation**: Integrates with unified image validation system
- **Drag & Drop**: Full drag-and-drop support with visual feedback
- **Memory Management**: Automatic cleanup of object URLs and resources
- **Error Handling**: Comprehensive error reporting with user-friendly messages
- **Type Safety**: Full TypeScript support with proper typing
- **Backward Compatibility**: Legacy options supported for non-image uploads

#### Usage Examples:

**Avatar Upload:**

```typescript
const [{ files, errors, isDragging }, { handleDrop, openFileDialog }] = useFileUpload({
  imageType: 'avatar',
  onFilesAdded: (newFiles) => {
    const file = newFiles[0]?.file;
    if (file instanceof File) {
      handleAvatarUpload(file);
    }
  },
});
```

**Gallery Upload (Multiple Files):**

```typescript
const [{ files }, { addFiles }] = useFileUpload({
  imageType: 'gallery',
  multiple: true,
  maxFiles: 10,
  onFilesChange: (allFiles) => {
    setGalleryImages(allFiles);
  },
});
```

### Media Query & Responsive Hooks (`/src/hooks/use-media-query.ts` & `/src/hooks/use-mobile.ts`)

```typescript
import { useMediaQuery } from '@/hooks/use-media-query';
import { useIsMobile } from '@/hooks/use-mobile';

const isDesktop = useMediaQuery('(min-width: 768px)');
const isMobile = useIsMobile();
```

- **`useMediaQuery(query)`**: Generic media query hook for responsive design
  - **Parameters**: `query: string` (CSS media query)
  - **Return Type**: `boolean`
  - **Use Case**: Conditional rendering based on screen size or device capabilities

- **`useMobile()`**: Shorthand for mobile detection
  - **Return Type**: `boolean`
  - **Use Case**: Mobile-specific UI adaptations

### Component State Management Hook (`/src/hooks/use-controlled-state.tsx`)

```typescript
import { useControlledState } from '@/hooks/use-controlled-state';

const [value, setValue] = useControlledState(defaultValue, controlledValue, onChange);
```

- **Purpose**: Handles controlled vs uncontrolled component patterns
- **Use Case**: Building reusable form components that can work in both modes
- **Features**: Automatic detection of controlled/uncontrolled state

---

## Utility Functions

### Styling Utilities (`/src/lib/utils.ts`)

```typescript
import { cn } from '@/lib/utils';

// Combines clsx and tailwind-merge for optimal className handling
const className = cn('base-class', conditionalClass && 'conditional', 'override-class');
```

- **`cn(...inputs: ClassValue[])`**: Intelligent className merging
  - **Features**: Combines clsx for conditional classes and tailwind-merge for conflict resolution
  - **Use Case**: All component styling where className composition is needed
  - **Benefits**: Prevents Tailwind CSS class conflicts and optimizes final output

### Database Connection (`/src/lib/db.ts`)

```typescript
import { prisma } from '@/lib/db';
```

- **`prisma`**: Shared Prisma client instance
  - **Features**: Connection pooling, proper configuration
  - **Use Case**: All database operations via DAL functions
  - **Note**: Should only be used within DAL functions, not directly in components or actions

### Context Creation Utility (`/src/lib/get-strict-context.tsx`)

```typescript
import { getStrictContext } from '@/lib/get-strict-context';

const [Provider, useContext] = getStrictContext<T>('ContextName');
```

- **`getStrictContext<T>(name?)`**: Create type-safe React context with error boundaries
  - **Return Type**: `[Provider, useContext]` tuple
  - **Features**: Automatic error throwing when context is used outside provider
  - **Use Case**: Creating contexts that enforce proper usage patterns
  - **Example**: Used in cities context for strict usage enforcement

---

## Zod Validation Schemas

All form validation and data parsing is handled through Zod schemas for type safety and runtime validation.

### Authentication Schemas (`/src/lib/schemas/auth_validation.ts`)

```typescript
import {
  emailSchema,
  passwordSchema,
  loginFormSchema,
  signupFormSchema,
} from '@/lib/schemas/auth_validation';
```

- **`emailSchema`**: Email validation with proper format checking and domain restrictions
- **`passwordSchema`**: Password validation (minimum 8 characters with security requirements)
- **`loginFormSchema`**: Complete login form validation combining email and password
- **`signupFormSchema`**: Registration form with password confirmation and validation

### Complete Profile Schemas (`/src/lib/schemas/complete-profile-schema.ts`)

```typescript
import { CompleteProfileSchema, Step4Schema } from '@/lib/schemas/complete-profile-schema';
```

- **`CompleteProfileSchema`**: Comprehensive profile completion validation
  - `name`: 3–12 chars
  - `userId`: 4–10 chars, starts with a letter, alphanumeric + underscore, no trailing or double underscores
  - `city`: must match one of `constants/italianCities` names
  - `telegram`: strict Telegram username regex
  - `profilePic`: optional File-like with size/type checks (rejects GIFs)

- **`Step4Schema`**: Extracted profile picture validation for reuse
- **Image Validation**: Uses unified image system (`IMAGE_TYPE_CONFIGS['avatar']`) for consistent validation across the application
  - **Size Limit**: 6MB (from avatar configuration)
  - **Allowed Formats**: JPEG, PNG, WebP, AVIF (from avatar configuration)
  - **Dimensions**: Optimized for 256x256 avatar display

### Dashboard Schemas (`/src/lib/schemas/dashboard.ts`)

```typescript
import {
  userIdSchema,
  nameSchema,
  telegramSchema,
  profileBasicsSchema,
  changeCitySchema,
  supportMessageSchema,
  changeEmailSchema,
  changePasswordSchema,
} from '@/lib/schemas/dashboard';
```

#### Component Schemas (Reused from CompleteProfileSchema):

- **`userIdSchema`**: UserId validation rules
- **`nameSchema`**: Name validation rules
- **`telegramSchema`**: Telegram handle validation rules

#### Dashboard-Specific Schemas:

- **`profileBasicsSchema`**: Profile update validation (name, userId, telegram)
- **`changeCitySchema`**: City selection validation with ID validation
- **`supportMessageSchema`**: Support ticket validation (subject + message)
- **`changeEmailSchema`**: Email update validation
- **`changePasswordSchema`**: Password change with current password and confirmation

#### Features:

- **Consistency**: Reuses base schemas from profile completion
- **Type Safety**: Full TypeScript integration with inferred types
- **Validation**: Runtime validation with user-friendly error messages

---

## Type Definitions

### Authentication Types (`/src/lib/auth.ts`)

```typescript
import { Session, User } from '@/lib/auth';
```

- **`Session`**: Better Auth session type with user data and authentication status
- **`User`**: Extended user type with application-specific fields
  - **Standard Better Auth Fields**: `id`, `email`, `name`, `image`, `firstName`, `lastName`
  - **Custom Application Fields**: `role`, `isProfileComplete`, `userId`, `telegramHandle`, `cityId`, `cityLastChangedAt`, `verified`, `verifiedAt`

### Result Types (`/src/lib/image-utils-client.ts`)

```typescript
import {
  ServiceResult,
  ActionResult,
  serviceToActionResult,
  handleServiceError,
} from '@/lib/image-utils-client';
```

- **`ServiceResult<T>`**: `{ success: true; data: T } | { success: false; error: string }`
  - **Use Case**: Service layer operations with consistent error handling
- **`ActionResult<T>`**: `{ ok: true; data: T } | { ok: false; error: string }`
  - **Use Case**: Server actions compatible with form handling
- **Utility Functions**:
  - **`serviceToActionResult()`**: Converts ServiceResult to ActionResult format
  - **`handleServiceError()`**: Standardized error handling with fallback messages

### Image System Types (`/src/lib/image-utils-client.ts` & `/src/lib/image-utils-server.ts`)

#### Client-Side Types:

```typescript
import {
  ImageType,
  ImageTypeConfig,
  CropArea,
  FileMetadata,
  FileWithPreview,
  ServiceResult,
  ActionResult,
} from '@/lib/image-utils-client';
```

- **`ImageType`**: Union of supported image categories
  - **Values**: `'avatar' | 'cover' | 'gallery' | 'thumbnail' | 'content' | 'background' | 'icon' | 'banner' | 'verification'`
  - **Use Case**: Type-safe image operations with category-specific constraints

- **`ImageTypeConfig`**: Configuration object for each image type
  - **Properties**: `maxSizeBytes`, `allowedMimeTypes`, `dimensions`, `quality`, `folder`
  - **Use Case**: Centralized configuration for validation and optimization

- **File Handling Types**:
  - **`CropArea`**: Image cropping coordinates `{ x, y, width, height }` (0-1 scale)
  - **`FileMetadata`**: Basic file information structure
  - **`FileWithPreview`**: File with preview URL and metadata for UI display

#### Server-Side Types:

```typescript
import { ImageUploadResult } from '@/lib/image-utils-server';
```

- **`ImageUploadResult`**: Cloudinary upload response structure
  - **Properties**: `storageKey`, `publicId`, `width`, `height`, `bytes`, `format`, `mimeType`, `url`, `secureUrl`
  - **Use Case**: Handling successful upload responses and database storage

### City Types (`/src/types/city.ts`)

```typescript
import type { City } from '@/types/city';
```

- **`City`**: Client-safe city data structure
  - **Properties**: `id`, `name`, `slug`, `region`, `province`, `provinceCode`, `lat`, `lng`, `altNames`, `isActive`, `sortOrder`
  - **Date Handling**: `createdAt`, `updatedAt` as ISO string format for JSON compatibility
  - **Coordinates**: `lat`, `lng` as numbers (converted from Prisma Decimal)
  - **Use Case**: City selection, display, and caching operations

---

## Context Providers

### Cities Context (`/src/contexts/cities-context.tsx`)

Provides city data management with intelligent caching and storage strategies.

```typescript
import { CitiesProvider, useCities, useCityName, useCityById } from '@/contexts/cities-context';
```

#### Provider Configuration:

```typescript
<CitiesProvider
  cities={initialCities} // Optional server-provided cities (RSC)
  storageMode="session" // 'session' | 'local'
  storageKey="cities@v1" // Cache key (change to invalidate)
>
  {children}
</CitiesProvider>
```

#### Hooks:

- **`useCities()`**: Gets all cities array with automatic loading and caching
  - **Return Type**: `City[]` (empty array when not loaded)
  - **Features**: Automatic loading from storage, server-side hydration support
- **`useCityName(id)`**: Gets city name by ID
  - **Parameters**: `id: number`
  - **Return Type**: `string | undefined`
  - **Use Case**: Display city names in UI without full city objects

- **`useCityById(id)`**: Gets full city object by ID
  - **Parameters**: `id: number`
  - **Return Type**: `City | undefined`
  - **Use Case**: Access complete city data including coordinates and metadata

#### Features:

- **Smart Caching**: Session or local storage with freshness detection
- **SSR Compatible**: Works with server-side rendering and hydration
- **Performance Optimized**: Efficient lookups and minimal re-renders
- **Storage Modes**:
  - **Session**: Survives hard refresh in same tab (default)
  - **Local**: Survives across tabs and browser restarts

---

## Cache Layer

### City Cache (`/src/lib/cache/city-cache.ts`)

Server-side in-memory cache for city data with automatic TTL and freshness management.

```typescript
import { getAllCities, refreshCities, getCityById, setCityCacheTTL } from '@/lib/cache/city-cache';
```

#### Core Functions:

- **`getAllCities()`**: Get all active cities with intelligent caching
  - **Return Type**: `Promise<City[]>`
  - **TTL**: 12 hours (configurable)
  - **Features**: In-memory caching, automatic refresh, active cities only
  - **Use Case**: City dropdowns, context providers, form options

- **`refreshCities()`**: Force refresh the city cache
  - **Use Case**: Admin operations, city data updates
  - **Effect**: Invalidates current cache and forces fresh database load

- **`getCityById(id: number)`**: Get single city by ID from cache
  - **Performance**: O(1) lookup from cached array
  - **Use Case**: City detail pages, user profile displays

- **`setCityCacheTTL(ms)`**: Adjust TTL dynamically

#### Cache Features:

- **Global State**: Uses globalThis for persistence across requests
- **TTL Management**: Automatic expiration and refresh
- **Data Transformation**: Converts Prisma types to client-safe City types
- **Active Filter**: Only serves active cities to prevent UI issues
- **Performance**: Reduces database queries for frequently accessed city data

---

## Email Services

### Resend Integration (`/src/lib/email/resend.ts`)

Email sending functionality using Resend service for authentication workflows.

```typescript
import { sendEmail, resend } from '@/lib/email/resend';
```

#### Functions:

- **`sendEmail({ from, to, subject, text })`**: Send emails via Resend
  - **Parameters**:
    - `from: 'verify' | 'reset'` - Email type determining sender address
    - `to: string` - Recipient email address
    - `subject: string` - Email subject line
    - `text: string` - Email content (plain text)
  - **Use Case**: Email verification, password reset workflows
  - **Integration**: Used by Better Auth for authentication emails

- **`resend`**: Direct Resend client instance
  - **Use Case**: Advanced email operations, custom email templates
  - **Access**: Full Resend SDK functionality for complex email scenarios

#### Configuration:

- **Environment Variables**: Uses `RESEND_API_KEY`, `Italihub_VERIFY_EMAIL`, `Italihub_RESET_EMAIL`
- **Email Types**: Separate sender addresses for verification and password reset
- **Integration**: Seamlessly integrated with Better Auth email workflows

### Email Templates (`/src/lib/email/reset-password.tsx`)

React-based email templates for consistent branding and user experience.

- **Purpose**: Structured email templates for password reset and other authentication flows
- **Framework**: React components that render to HTML for email clients
- **Use Case**: Professional, branded emails for user communication

---

## Metadata Utilities

### SEO & Metadata (`/src/lib/metadata.ts`)

Utilities for consistent metadata generation and SEO optimization.

```typescript
import { createMetadata, baseUrl } from '@/lib/metadata';
```

#### Functions:

- **`createMetadata(override: Metadata)`**: Generate consistent metadata objects
  - **Parameters**: `override: Metadata` - Next.js Metadata object with overrides
  - **Return Type**: `Metadata` - Complete metadata with defaults and social tags
  - **Features**:
    - Automatic OpenGraph integration
    - Twitter Card configuration
    - Consistent branding across pages
    - URL and image defaults
  - **Use Case**: Page-level SEO optimization, social media sharing

- **`baseUrl`**: Environment-aware base URL detection
  - **Development**: `http://localhost:3000`
  - **Production**: Uses `VERCEL_URL` or configured production URL
  - **Use Case**: Absolute URL generation, canonical URLs, social sharing

## Audit System

### Core Audit Logger (`/src/lib/audit.ts`)

Exports:

- Core functions: **`logAudit`**, **`logSuccess`**, **`logFailure`**, **`logAuditBatch`**
- Wrapper for audited mutations: **`auditServerAction(action, entityType, operation, context, entityId?, note?, metadata?)`**
- Auth-specific auditor: **`AuthAuditor`** with methods:
  - `logRegistrationSuccess(email, userId, metadata?)`
  - `logRegistrationFailure(email, errorCode, metadata?)`
  - `logLoginSuccess(userId, sessionId, metadata?)`
  - `logLoginFailure(email, errorCode, metadata?)`
  - `logLogoutSuccess(userId, sessionId?, metadata?)`
  - `logOAuthSuccess(action, userId, provider, metadata?)`
  - `logOAuthFailure(action, userId|null, provider, errorCode, metadata?)`
  - `logPasswordResetRequest(email, userId?, metadata?)`
  - `logPasswordResetConfirm(userId, metadata?)`

### Audit Context Helpers (`/src/lib/audit-context.ts`)

- **`getAuditContextFromSession()`**: Pulls user/session from Better Auth
- **`getEnhancedAuditContext()`**: Adds IP, userAgent, requestId

---

## Best Practices

### 1. Authentication

- **Server-side**: Always use `requireUser()` for protected resources, `getCurrentUser()` for optional auth
- **Client-side**: Use `useSession()` hook from auth client for user data and state
- **Authentication vs Profile Data**: Use Better Auth functions for authentication, DAL functions for profile operations
- **Caching**: Leverage per-request caching provided by authentication functions

### 2. Database Operations

- **DAL Pattern**: Always use DAL functions instead of direct Prisma calls in application code
- **Separation**: Keep database logic in DAL, business logic in server actions
- **Error Handling**: DAL functions should throw meaningful errors, actions should catch and transform them
- **Transactions**: Use Prisma transactions in DAL functions for complex multi-table operations

### 3. Image Operations

- **Client-side**: Use unified image utilities for validation, cropping, resize, URL generation
- **Server-side**: Use specialized services (AvatarService, VerificationImageService, etc.) for complete workflows
- **Validation**: Always validate on client before upload, re-validate on server
- **Cleanup**: Implement proper cleanup for failed operations and image replacements

### 4. Error Handling & Result Types

- **Consistent Patterns**: Use `ServiceResult<T>` for services, `ActionResult<T>` for server actions
- **Error Transformation**: Use `serviceToActionResult()` and `handleServiceError()` utilities
- **User Experience**: Provide meaningful error messages through standardized error handling

### 5. Type Safety & Validation

- **Runtime Validation**: Use Zod schemas for all user input validation
- **Type Inference**: Leverage TypeScript's type inference with Zod for consistent types
- **Schema Reuse**: Reuse validation schemas between different forms (e.g., dashboard schemas extending profile schemas)

### 6. Caching & Performance

- **City Data**: Use city cache for frequently accessed city information
- **Context Providers**: Leverage context caching with appropriate storage strategies
- **Image Optimization**: Use type-specific image configurations for optimal performance

---

## Usage Examples

### Complete Authentication Flow:

```typescript
// Server component - Protected resource
import { requireUser } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await requireUser(); // Throws 401 if not authenticated
  return (
    <div>
      <h1>Welcome to Dashboard, {user.name}!</h1>
      <p>User ID: {user.userId}</p>
      <p>City: {user.cityId}</p>
    </div>
  );
}

// Server component - Optional authentication
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser(); // Returns null if not authenticated

  return (
    <div>
      <h1>Welcome to ItaliaHub</h1>
      {user ? (
        <p>Hello, {user.name}! <a href="/dashboard">Go to Dashboard</a></p>
      ) : (
        <p><a href="/login">Sign In</a> to access your dashboard</p>
      )}
    </div>
  );
}

// Client component - Real-time auth state
import { useSession } from '@/lib/auth-client';

export function UserProfile() {
  const { user, session } = useSession();

  if (!session) return <div>Please sign in</div>;
  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Profile Complete: {user.isProfileComplete ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Complete Image Upload with Validation and Cropping:

```typescript
import { useFileUpload } from '@/hooks/use-file-upload';
import { cropImageToBlob, type CropArea } from '@/lib/image-utils-client';
import { updateProfilePictureAction } from '@/lib/actions/update-profile-picture';
import { useState } from 'react';

export function AvatarUpload() {
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [{ files, errors, isDragging }, { handleDrop, openFileDialog, clearFiles }] = useFileUpload({
    imageType: 'avatar', // Automatic validation for avatar constraints
    onFilesAdded: (newFiles) => {
      const file = newFiles[0];
      if (file) {
        // Show cropper modal/component
        showCropper(file.preview);
      }
    }
  });

  const handleCropAndUpload = async (area: CropArea) => {
    if (!files[0]) return;

    setIsUploading(true);
    try {
      // 1. Crop image on client side
      const cropped = await cropImageToBlob(files[0].preview, area, 256, 256);
      if (!cropped) {
        throw new Error('Failed to crop image');
      }

      // 2. Upload via server action
      const formData = new FormData();
      formData.append('profilePic', cropped.blob);
      const result = await updateProfilePictureAction(formData);

      if (result.ok) {
        toast.success('Avatar updated successfully!');
        clearFiles();
      } else {
        toast.error(result.error);
      }

      // Cleanup
      URL.revokeObjectURL(cropped.url);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        className={cn("border-2 border-dashed p-4", isDragging && "border-blue-500")}
      >
        <button onClick={openFileDialog} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Choose Avatar'}
        </button>
      </div>

      {errors.map(error => (
        <p key={error} className="text-red-500">{error}</p>
      ))}
    </div>
  );
}
```

### Smart Image Display with Optimization:

```typescript
import { getOptimizedUrl, generateResponsiveUrls } from '@/lib/image-utils-client';
import { useCities, useCityName } from '@/contexts/cities-context';

export function UserCard({ user }: { user: User }) {
  const cityName = useCityName(user.cityId);

  // Optimized avatar URL with fallback
  const avatarUrl = user.image ? getOptimizedUrl(user.image, 'avatar') : '/avatar-default.svg';

  return (
    <div className="user-card">
      <img
        src={avatarUrl || '/avatar-default.svg'}
        alt={`${user.name}'s avatar`}
        className="w-16 h-16 rounded-full"
      />
      <div>
        <h3>{user.name}</h3>
        <p>@{user.userId}</p>
        {cityName && <p>📍 {cityName}</p>}
        {user.verified && <span className="verified-badge">✓ Verified</span>}
      </div>
    </div>
  );
}

// Responsive image with multiple sizes
export function HeroImage({ coverImage }: { coverImage: string | null }) {
  const storageKey = coverImage;

  if (!storageKey) return <div className="placeholder">No image</div>;

  const publicId = storageKey.replace(/\.[^.]+$/, '');
  const urls = generateResponsiveUrls(publicId, 1200);

  return (
    <img
      src={urls.medium}
      srcSet={`${urls.small} 800w, ${urls.medium} 1200w, ${urls.large} 1600w, ${urls.xlarge} 2400w`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      alt="Cover image"
      className="w-full h-64 object-cover"
    />
  );
}
```

### Complete Form with Validation:

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { profileBasicsSchema } from '@/lib/schemas/dashboard';
import { useUserIdAvailability } from '@/hooks/use-userid-availability';
import { useEffect } from 'react';

export function ProfileForm({ currentUser }: { currentUser: User }) {
  const form = useForm({
    resolver: zodResolver(profileBasicsSchema),
    defaultValues: {
      name: currentUser.name,
      userId: currentUser.userId || '',
      telegram: currentUser.telegramHandle || '',
    }
  });

  const userId = form.watch('userId');
  const { status, message, check } = useUserIdAvailability(currentUser.userId || undefined);

  useEffect(() => {
    if (userId) check(userId);
  }, [userId, check]);

  const onSubmit = async (data: any) => {
    if (status !== 'available') return;

  // Submit form data via your server action (do not call DAL directly from the client)
  // const result = await saveProfileBasicsAction(data)
    if (result.ok) {
      toast.success('Profile updated!');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label>Name</label>
        <input {...form.register('name')} />
        {form.formState.errors.name && <span>{form.formState.errors.name.message}</span>}
      </div>

      <div>
        <label>User ID</label>
        <input {...form.register('userId')} />
        {status === 'checking' && <span>Checking...</span>}
        {status === 'available' && <span className="text-green-600">✓ Available</span>}
        {status === 'taken' && <span className="text-red-600">Already taken</span>}
        {(status === 'invalid' || status === 'reserved' || status === 'error') && (
          <span className="text-red-600">{message}</span>
        )}
        {form.formState.errors.userId && <span>{form.formState.errors.userId.message}</span>}
      </div>

      <div>
        <label>Telegram</label>
        <input {...form.register('telegram')} placeholder="@username" />
        {form.formState.errors.telegram && <span>{form.formState.errors.telegram.message}</span>}
      </div>

      <button
        type="submit"
        disabled={status !== 'available' || form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

---

## Architecture Notes

### Authentication Architecture

The application uses **Better Auth** as the core authentication system:

- **Separation of Concerns**: Authentication logic (Better Auth) vs Profile data (DAL functions)
- **Session Management**: Per-request caching with `getCurrentUser()` and `requireUser()`
- **Client/Server Split**: Server-side authentication checks and client-side reactive auth state
- **Database Hooks**: Custom user creation validation and session lifecycle management

### Image Processing Architecture

**Unified image architecture** with security-first design and clear client/server boundaries:

- **Client-Side** (`/src/lib/image-utils-client.ts`): Browser-safe validation, URL generation, cropping, and optimization
- **Server-Side** (`/src/lib/image-utils-server.ts`): Cloudinary operations, specialized services, server-side MIME verification
- **Security Features**: Server-side MIME verification using `file-type` library, content-hash naming for integrity
- **Type Safety**: Strongly typed with 9 `ImageType` categories and centralized configuration objects
- **Service Pattern**: Specialized services (AvatarService, etc.) with complete workflows and automatic cleanup
- **Provider Abstraction**: Clean separation between storage providers (Cloudinary) and business logic
- **Error Handling**: Consistent `ServiceResult` and `ActionResult` patterns with comprehensive rollback mechanisms

### Data Access Layer (DAL) Pattern

Structured database access with clear responsibilities:

- **DAL Functions**: Pure database operations with business-specific logic
- **Server Actions**: Form handling and user interaction workflows
- **Authentication Integration**: DAL operates on authenticated user data from Better Auth
- **Cache Integration**: DAL functions work with cache layers for performance

### Caching Strategy

Multi-level caching for optimal performance:

- **City Cache**: Server-side in-memory cache with TTL for frequently accessed city data
- **Context Caching**: Client-side storage (session/local) for UI state persistence
- **Authentication Caching**: Per-request memoization to prevent duplicate auth lookups

### Type Safety & Validation

Comprehensive type safety from client to database:

- **Zod Schemas**: Runtime validation with TypeScript inference
- **Schema Reuse**: Consistent validation between forms and API endpoints
- **Result Types**: Standardized error handling with `ServiceResult` and `ActionResult`
- **Image Types**: Category-specific validation and optimization

### Current Status

- ✅ **Authentication**: Better Auth integration with custom user schema extensions
- ✅ **Image System**: Unified client/server architecture with specialized services
- ✅ **DAL Layer**: Complete abstraction of database operations
- ✅ **Validation**: Comprehensive Zod schema system with type inference
- ✅ **Caching**: Multi-level caching strategy for performance optimization
- ✅ **Type Safety**: End-to-end TypeScript coverage with runtime validation
- ✅ **Production Ready**: Clean builds, comprehensive error handling, performance optimized

---

This documentation reflects the current state of the ItaliaHub application as of **October 2025**. All functions, hooks, and services documented here mirror the codebase and follow established architectural patterns. The codebase maintains strict separation of concerns, comprehensive type safety, and consistent error handling patterns throughout.

For questions about specific implementations or architectural decisions, refer to the source code in the referenced file paths or consult the team's development guidelines.

---

## Prisma Enums (server + client)

Centralized, type-safe usage of Prisma enums across server and client with zero duplication.

### Generation

- Generator configuration (in `prisma/schema.prisma`):

```prisma
generator enum {
  provider = "prisma-generator-enum"
  output   = "../src/generated/enums.ts"
}
```

- After editing enums in Prisma schema, run generate to sync:

```powershell
npx prisma generate
```

This produces a tiny client-safe module at `src/generated/enums.ts` that exports const enum objects and their string literal types. Prisma Client continues to be generated at `src/generated/prisma` (as configured already).

### Unified import helper

- Use `src/lib/enums/index.ts` for a single import surface:
  - Types re-exported from `@/generated/prisma` (server-safe types)
  - Runtime enum objects re-exported as `Enum` from `@/generated/enums` (client-safe values)
  - Helpers: `valuesOf`, `humanize`, `toOptions`

```ts
// Types (usable both server and client as type-only imports)
import type { AdStatus, ServiceCategory } from '@/lib/enums';

// Runtime enum objects and helpers (client-safe)
import { Enum, valuesOf, toOptions, humanize } from '@/lib/enums';

// Build UI options
const statusValues = valuesOf(Enum.AdStatus); // ['PENDING','ONLINE','REJECTED','EXPIRED']
const statusOptions = toOptions(Enum.AdStatus); // [{ value: 'PENDING', label: 'Pending' }, ...]
```

### Server-side usage

- Safe in server contexts (DAL, server actions, RSC):
  - Use type-only imports for enum types
  - Use generated runtime enum objects for validation (e.g., Zod)

```ts
import 'server-only';
import { z } from 'zod';
import type { ServiceCategory } from '@/lib/enums';
import { Enum } from '@/lib/enums';

// Zod validation using generated runtime object
const serviceSchema = z.object({
  category: z.nativeEnum(Enum.ServiceCategory),
});

// Inferred TS types align with Prisma enums
type ServiceForm = z.infer<typeof serviceSchema> & { category: ServiceCategory };
```

Why this is good:

- Zero duplication — enums are single-sourced in Prisma schema
- `z.nativeEnum(...)` stays in sync after `prisma generate`
- No Prisma runtime bundled in client code

### Client-side usage

- Never import `@prisma/client` (or your generated Prisma client) in client components.
- Import from `@/lib/enums` instead:

```tsx
'use client';
import { Enum, toOptions } from '@/lib/enums';
import type { AdStatus } from '@/lib/enums';

const options = toOptions(Enum.AdStatus);

export function StatusSelect(props: { value: AdStatus; onChange: (v: AdStatus) => void }) {
  return (
    <select value={props.value} onChange={(e) => props.onChange(e.target.value as AdStatus)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
```

### Notes and conventions

- Add or update enums only in `prisma/schema.prisma`, then run `npx prisma generate`.
- In server files: prefer type-only imports from `@/lib/enums` and use `Enum.X` for runtime values.
- In client files: import both types and runtime values from `@/lib/enums`.
- Helpers:
  - `valuesOf(Enum.X)` → array of values
  - `humanize('SOME_VALUE')` → `Some Value`
  - `toOptions(Enum.X)` → `{ value, label }[]` for selects
