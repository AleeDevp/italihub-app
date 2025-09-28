# ItaliaHub Reusable Components Documentation

This document provides a comprehensive overview of all reusable functions, services, DAL functions, hooks, utilities, and authentication methods available in the ItaliaHub application.

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Data Access Layer (DAL)](#data-access-layer-dal)
3. [Server Actions](#server-actions)
4. [Image Processing & Management](#image-processing--management)
5. [Client-Side Hooks](#client-side-hooks)
6. [Utility Functions](#utility-functions)
7. [Zod Validation Schemas](#zod-validation-schemas)
8. [Type Definitions](#type-definitions)
9. [Context Providers](#context-providers)
10. [Cache Layer](#cache-layer)
11. [Email Services](#email-services)
12. [Metadata Utilities](#metadata-utilities)

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
  role: 'user' | 'admin';
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

- **`linkSocial(provider)`**: Link social accounts
  - **Parameters**: `provider: 'google'`
  - **Use Case**: Account linking in settings

### Session Management (`/src/lib/get-session.ts`)

```typescript
import { getServerSession } from '@/lib/get-session';
```

- **`getServerSession()`**: Server-side session retrieval
  - **Use Case**: Getting session in layouts and server components
  - **Return Type**: `Promise<Session | null>`
  - **Caching**: Cached per-request for performance

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

#### Profile Picture Operations:

```typescript
import { updateUserProfilePicture, getUserProfilePicture } from '@/lib/dal/user';
```

- **`updateUserProfilePicture(userId, imageKey)`**: Updates user's profile picture
  - **Parameters**: `userId: string, imageKey: string`
  - **Use Case**: Database update after successful image upload
  - **Integration**: Used by image services for complete workflow

- **`getUserProfilePicture(userId)`**: Gets current profile picture key
  - **Return Type**: `Promise<string | null>`
  - **Use Case**: Cleanup operations when replacing images

### Other DAL Operations

#### City Operations (`/src/lib/dal/cities.ts`)

```typescript
import { updateCity } from '@/lib/dal/cities';
```

- **`updateCity(id, data)`**: Updates city data and refreshes cache
  - **Use Case**: Admin operations for city management
  - **Cache Integration**: Automatically invalidates city cache

#### Verification Operations (`/src/lib/dal/verification.ts`)

```typescript
import { getLatestVerification, submitVerificationRequest } from '@/lib/dal/verification';
```

- **`getLatestVerification(userId)`**: Gets user's latest verification request
  - **Use Case**: Checking verification status in dashboard
  - **Return Type**: Latest verification request with status

- **`submitVerificationRequest(userId, data)`**: Creates new verification request
  - **Use Case**: User verification submission
  - **Business Rules**: Handles verification workflow

#### Notification Operations (`/src/lib/dal/notifications.ts`)

```typescript
import {
  getUnreadCount,
  listNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
} from '@/lib/dal/notifications';
```

- **`getUnreadCount(userId)`**: Get count of unread notifications
  - **Use Case**: Badge counts in navigation
  - **Performance**: Optimized query for count only

- **`listNotifications(userId, params?)`**: List notifications with pagination
  - **Parameters**: Optional pagination and filtering parameters
  - **Use Case**: Notification center/inbox

- **`markAsRead(notificationId, userId)`**: Mark single notification as read
- **`markAllAsRead(userId)`**: Mark all notifications as read
- **`createNotification(userId, data)`**: Create new notification
  - **Use Case**: System-generated notifications

#### Advertisement Operations (`/src/lib/dal/ads.ts`)

```typescript
import {
  getUserAdStats,
  getUserAdList,
  getAdById,
  type UserAdListParams,
  type UserAdListItem,
} from '@/lib/dal/ads';
```

- **`getUserAdStats(userId)`**: Get user's ad statistics
  - **Return Type**: Counts for online/pending/expired ads
  - **Use Case**: Dashboard overview widgets

- **`getUserAdList(params)`**: Get paginated list of user's ads
  - **Parameters**: Filtering, sorting, and pagination options
  - **Return Type**: Typed list with `UserAdListItem` objects
  - **Use Case**: User's ad management interface

- **`getAdById(adId, userId?)`**: Get single ad by ID
  - **Parameters**: Optional userId for ownership verification
  - **Use Case**: Ad detail views with access control

#### Metrics & Analytics Operations (`/src/lib/dal/metrics.ts`)

```typescript
import { recordAdView, recordAdContactClick, getAdMetrics } from '@/lib/dal/metrics';
```

- **`recordAdView(adId)`**: Record ad view for analytics
- **`recordAdContactClick(adId)`**: Record contact button clicks
- **`getAdMetrics(adId)`**: Get ad performance metrics
  - **Use Case**: Analytics and reporting features

#### Announcement Operations (`/src/lib/dal/announcements.ts`)

```typescript
import { getActiveAnnouncements, getAnnouncementById } from '@/lib/dal/announcements';
```

- **`getActiveAnnouncements()`**: Get all active system announcements
- **`getAnnouncementById(id)`**: Get single announcement by ID
  - **Use Case**: System-wide notifications and updates

#### Activity Tracking (`/src/lib/dal/activity.ts`)

```typescript
import { logUserActivity, getUserRecentActivity } from '@/lib/dal/activity';
```

- **`logUserActivity(userId, action, metadata?)`**: Log user activity
  - **Use Case**: Audit trails and user behavior tracking
  - **Parameters**: Action type and optional metadata

- **`getUserRecentActivity(userId, limit?)`**: Get recent user activity history
  - **Use Case**: Activity feeds and user dashboards

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

```typescript
import { authAction } from '@/lib/actions/auth-actions';
```

- **Authentication-related server actions**: Form handling for auth workflows
  - **Integration**: Works with Better Auth system
  - **Use Case**: Login, registration, and auth form processing

---

## Image Processing & Management

Comprehensive image handling system with client/server separation and type-safe operations.

### Client-Side Image Utilities (`/src/lib/image-utils-client.ts`)

Browser-safe image utilities that can be used in React components without Node.js dependencies.

```typescript
import {
  validateImageFile,
  resolveImageUrl,
  generateCloudinaryUrl,
  getOptimizedUrl,
  cropImageToBlob,
  formatFileSize,
  detectImageType,
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

- **`resolveImageUrl(storageKey, fallback?, imageType?)`**: Smart image URL resolution
  - **Parameters**: `storageKey: string | null, fallback?: string, imageType?: ImageType`
  - **Return Type**: `string`
  - **Features**: Automatic optimization, fallback handling, type-specific sizing
  - **Use Case**: Display images with proper optimization

- **`generateCloudinaryUrl(storageKey, imageType, options?)`**: Generate optimized Cloudinary URLs
  - **Features**: Type-specific optimization, responsive image generation
  - **Use Case**: Custom image transformations

- **`getOptimizedUrl(storageKey, imageType)`**: Get optimized URL for image type
  - **Use Case**: Standard optimized images for UI components

#### Utilities:

- **`formatFileSize(bytes, decimals?)`**: Human-readable file size formatting
  - **Parameters**: `bytes: number, decimals?: number`
  - **Return Type**: `string`
  - **Example**: `formatFileSize(1024)` → `"1 KB"`

- **`detectImageType(file)`**: Detect appropriate image type from file characteristics
  - **Use Case**: Auto-categorization of uploaded images

#### Configuration & Types:

- **`IMAGE_TYPE_CONFIGS`**: Complete configuration for all image types
  - **Types**: `avatar`, `cover`, `gallery`, `thumbnail`, `content`, `background`, `icon`, `banner`
  - **Properties**: `maxSizeBytes`, `allowedMimeTypes`, `dimensions`, `quality`, `folder`

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
  ImageService,
  AvatarService,
  CoverPhotoService,
  GalleryService,
  ContentImageService,
  type ImageUploadResult,
} from '@/lib/image-utils-server';
```

#### Core Upload Operations:

- **`uploadImageToCloudinary(file, userId, imageType)`**: Upload files to Cloudinary
  - **Parameters**: `file: File, userId: string, imageType: ImageType`
  - **Return Type**: `Promise<ServiceResult<ImageUploadResult>>`
  - **Features**: Validation, optimization, unique naming, retry logic
  - **Use Case**: Server actions for image uploads

#### Cleanup Operations:

- **`deleteCloudinaryImage(storageKey)`**: Delete single image from Cloudinary
  - **Parameters**: `storageKey: string`
  - **Features**: Safe deletion with error handling
  - **Use Case**: Image replacement and cleanup

- **`bulkDeleteCloudinaryImages(storageKeys)`**: Efficient bulk deletion
  - **Parameters**: `storageKeys: string[]`
  - **Use Case**: Mass cleanup operations

#### Specialized Services:

- **`ImageService`**: Base class for all image operations
  - **Methods**: `upload()`, `delete()`, `validateAndUpload()`
  - **Features**: Consistent error handling, logging, retry logic

- **`AvatarService`**: Profile picture management
  - **Methods**: `updateAvatar()`, `deleteAvatar()`
  - **Features**: Database integration, cleanup handling
  - **Use Case**: Complete avatar workflow

- **Service Classes**: `CoverPhotoService`, `GalleryService`, `ContentImageService`
  - **Features**: Type-specific optimizations and constraints
  - **Use Case**: Specialized image handling workflows

---

## Client-Side Hooks

### UserId Management Hooks (`/src/hooks/use-userid-availability.ts` & `/src/hooks/use-userid-validation.ts`)

```typescript
import { useUserIdAvailability } from '@/hooks/use-userid-availability';
import { useUserIdValidation } from '@/hooks/use-userid-validation';
```

#### UserId Availability Checking:

- **`useUserIdAvailability(userId, currentUserId?)`**: Real-time availability checking
  - **Parameters**: `userId: string, currentUserId?: string`
  - **Return Type**: `{ status: 'available' | 'taken' | 'reserved' | 'invalid', isChecking: boolean }`
  - **Features**: Debounced checking, loading states, comprehensive validation
  - **Use Case**: Profile forms with live feedback

#### UserId Format Validation:

- **`useUserIdValidation(userId)`**: Format validation hook
  - **Features**: Real-time format validation using Zod schemas
  - **Integration**: Works with availability checking for complete validation
  - **Use Case**: Form validation and user feedback

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
import { useMobile } from '@/hooks/use-mobile';

const isDesktop = useMediaQuery('(min-width: 768px)');
const isMobile = useMobile();
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
import {
  CompleteProfileSchema,
  Step4Schema,
  MAX_PROFILE_PIC_BYTES,
  ACCEPTED_PROFILE_PIC_TYPES,
} from '@/lib/schemas/complete-profile-schema';
```

- **`CompleteProfileSchema`**: Comprehensive profile completion validation
  - **`name`**: 3-12 characters, alphanumeric with spaces
  - **`userId`**: 4-10 characters, alphanumeric + underscore, no consecutive underscores
  - **`city`**: Must be valid Italian city ID from database
  - **`telegram`**: Valid Telegram username format (@username)
  - **`profilePic`**: Optional file validation with size and format restrictions

- **`Step4Schema`**: Extracted profile picture validation for reuse
- **Constants**:
  - **`MAX_PROFILE_PIC_BYTES`**: File size limit (6MB)
  - **`ACCEPTED_PROFILE_PIC_TYPES`**: Allowed MIME types array

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
  - **Values**: `'avatar' | 'cover' | 'gallery' | 'thumbnail' | 'content' | 'background' | 'icon' | 'banner'`
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
  - **Properties**: `storageKey`, `publicId`, `width`, `height`, `bytes`, `format`, `url`, `secureUrl`
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
  - **Return Type**: `City[] | null`
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
import { getAllCities, refreshCities, getCityById, getCityBySlug } from '@/lib/cache/city-cache';
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

- **`getCityBySlug(slug: string)`**: Get single city by slug from cache
  - **Performance**: Efficient slug-based lookup
  - **Use Case**: SEO-friendly URLs, city pages

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

- **Client-side**: Use unified image utilities for validation, cropping, and URL generation
- **Server-side**: Use specialized services (AvatarService, etc.) for complete workflows
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
        <p><a href="/signin">Sign In</a> to access your dashboard</p>
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
import { resolveImageUrl } from '@/lib/image-utils-client';
import { useCities, useCityName } from '@/contexts/cities-context';

export function UserCard({ user }: { user: User }) {
  const cityName = useCityName(user.cityId);

  // Smart URL resolution with fallback and optimization
  const avatarUrl = resolveImageUrl(
    user.image,
    '/avatar-default.svg',
    'avatar'
  );

  return (
    <div className="user-card">
      <img
        src={avatarUrl}
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
  const baseUrl = coverImage;

  if (!baseUrl) return <div className="placeholder">No image</div>;

  return (
    <img
      src={resolveImageUrl(baseUrl, null, 'cover')}
      srcSet={`
        ${generateCloudinaryUrl(baseUrl, 'cover', { width: 800 })} 800w,
        ${generateCloudinaryUrl(baseUrl, 'cover', { width: 1200 })} 1200w,
        ${generateCloudinaryUrl(baseUrl, 'cover', { width: 1600 })} 1600w
      `}
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
  const { status, isChecking } = useUserIdAvailability(userId, currentUser.userId);

  const onSubmit = async (data: any) => {
    if (status !== 'available') return;

    // Submit form data
    const result = await updateProfileBasics(data);
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
        {isChecking && <span>Checking...</span>}
        {!isChecking && status === 'available' && <span className="text-green-600">✓ Available</span>}
        {!isChecking && status === 'taken' && <span className="text-red-600">Already taken</span>}
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

Unified image system with clear client/server boundaries:

- **Client-Side** (`/src/lib/image-utils-client.ts`): Browser-safe validation, URL generation, cropping
- **Server-Side** (`/src/lib/image-utils-server.ts`): Cloudinary operations, specialized services
- **Type Safety**: Strongly typed with `ImageType` categories and configuration objects
- **Service Pattern**: Specialized services (AvatarService, etc.) for complete workflows
- **Error Handling**: Consistent `ServiceResult` and `ActionResult` patterns

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

This documentation reflects the current state of the ItaliaHub application as of **September 2025**. All functions, hooks, and services documented here are actively used in production and follow established architectural patterns. The codebase maintains strict separation of concerns, comprehensive type safety, and consistent error handling patterns throughout.

For questions about specific implementations or architectural decisions, refer to the source code in the referenced file paths or consult the team's development guidelines.
