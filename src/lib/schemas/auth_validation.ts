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
