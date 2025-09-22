import { italianCities } from '@/constants/italianCities';
import { z } from 'zod';

export const CompleteProfileSchema = z.object({
  name: z.string().min(3, 'at least 3 characters!').max(12, 'too long!'),
  username: z
    .string()
    .min(4, 'at least 4 characters!')
    .max(15, 'too long!')
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
  profilePic: z.any().nullable(),
});

// Step-level schemas for per-step validation gating
export const Step1Schema = CompleteProfileSchema.pick({ name: true, username: true });
export const Step2Schema = CompleteProfileSchema.pick({ city: true, confirmed: true });
export const Step3Schema = CompleteProfileSchema.pick({ telegram: true });
export const Step4Schema = CompleteProfileSchema.pick({ profilePic: true });
