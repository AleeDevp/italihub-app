import { italianCities } from '@/constants/italianCities';
import { z } from 'zod';

export const MAX_PROFILE_PIC_BYTES = 6 * 1024 * 1024; // 6 MB
export const ACCEPTED_PROFILE_PIC_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const CompleteProfileSchema = z.object({
  name: z.string().min(3, 'at least 3 characters!').max(12, 'too long!'),
  userId: z
    .string()
    .min(4, 'at least 4 characters!')
    .max(10, 'too long!')
    .regex(/^\S+$/, 'no white spaces!')
    .regex(/^[A-Za-z0-9_]+$/, 'Symbols not allowed!')
    .regex(/^[A-Za-z]/, 'Must start with a letter')
    .regex(/^(?!.*__).*$/, 'No consecutive underscores allowed')
    .regex(/.*[^_]$/, 'no underscore at the end'),

  city: z.string().refine((val) => italianCities.map((city) => city.name).includes(val), {
    message: 'Please select a valid city from the list.',
  }),
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm.',
  }),
  telegram: z
    .string()
    .regex(/^(?=.{5,32}$)(?!.*__)(?!^(telegram|admin|support))[a-z][a-z0-9_]*[a-z0-9]$/i, {
      message: 'not valid username!',
    }),
  profilePic: z
    .any()
    .nullable()
    .superRefine((file, ctx) => {
      // Allow null (optional)
      if (file == null) return;

      // Narrow to a File-like object
      const type = (file as any)?.type as string | undefined;
      const size = (file as any)?.size as number | undefined;
      if (!type || typeof size !== 'number') {
        ctx.addIssue({ code: 'custom', message: 'Invalid file' });
        return;
      }

      // Reject animated GIFs
      if (type === 'image/gif') {
        ctx.addIssue({ code: 'custom', message: 'Animated GIFs are not allowed' });
        return;
      }

      // Enforce allowlist
      if (!ACCEPTED_PROFILE_PIC_TYPES.includes(type as any)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Unsupported image format. Use JPEG, PNG, WebP, or AVIF.',
        });
      }

      // Enforce size cap
      if (size > MAX_PROFILE_PIC_BYTES) {
        ctx.addIssue({ code: 'custom', message: 'File too large (max 6 MB)' });
      }
    }),
});

// Step-level schemas for per-step validation gating
export const Step1Schema = CompleteProfileSchema.pick({ name: true, userId: true });
export const Step2Schema = CompleteProfileSchema.pick({ city: true, confirmed: true });
export const Step3Schema = CompleteProfileSchema.pick({ telegram: true });
export const Step4Schema = CompleteProfileSchema.pick({ profilePic: true });
