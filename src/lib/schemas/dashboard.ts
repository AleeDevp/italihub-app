import { z } from 'zod';
import { emailSchema, passwordSchema } from './auth_validation';
import { CompleteProfileSchema } from './complete-profile-schema';

// Base validation schemas for dashboard - using CompleteProfileSchema components
export const userIdSchema = CompleteProfileSchema.shape.userId;
export const nameSchema = CompleteProfileSchema.shape.name;
export const telegramSchema = CompleteProfileSchema.shape.telegram;

// Export imported schemas for consistency
export { emailSchema, passwordSchema };

// Profile update schema
export const profileBasicsSchema = z.object({
  name: nameSchema,
  userId: userIdSchema,
  telegram: telegramSchema,
});

// City change schema - for when user selects a new city from the dropdown
export const changeCitySchema = z.object({
  newCityId: z.number().int().positive(), // Simple validation for city selection
});

// Support message schema
export const supportMessageSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be at most 200 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be at most 5000 characters'),
});

// Settings schemas
export const changeEmailSchema = z.object({
  newEmail: emailSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Verification schema
export const verificationSchema = z.object({
  method: z.enum([
    'LANDMARK_SELFIE',
    'STUDENT_CARD',
    'IDENTITA_DIGITALE',
    'PERMESSO_SOGGIORNO',
    'OTHER',
  ]),
  userNote: z.string().max(500, 'Note must be at most 500 characters').optional(),
  files: z
    .array(
      z.object({
        storageKey: z.string().min(1, 'Storage key is required'),
        mimeType: z.string().optional(),
        bytes: z.number().optional(),
        role: z.enum(['DOCUMENT', 'SELFIE', 'OTHER']).optional(),
      })
    )
    .min(1, 'At least one file is required'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(12),
});
