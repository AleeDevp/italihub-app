import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(1, { message: 'Password is required' })
  .min(8, { message: 'Password must be at least 8 characters' });

export const emailSchema = z.string().email('Invalid email address');

// login form schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// registration form schema
export const signupFormSchema = z
  .object({
    name: z.string().min(3, 'name must be at least 3 characters long'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// change password schema (shared client/server)
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });
