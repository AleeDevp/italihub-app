'use server';

import { changeCity } from '@/data/user/user.dal';
import { requireUser } from '@/lib/auth/server';
import { z } from 'zod';

export type ChangeCityResult =
  | { ok: true; data: { revokedVerification: boolean } }
  | { ok: false; error: string; cooldownDays?: number };

const changeCitySchema = z.object({
  cityId: z.number().int().positive('Please select a valid city'),
});

export async function changeCityAction(formData: FormData): Promise<ChangeCityResult> {
  try {
    // Authenticate user
    const user = await requireUser();

    // Extract and validate form data
    const rawData = {
      cityId: parseInt(formData.get('cityId') as string),
    };

    // Validate with Zod schema
    const validationResult = changeCitySchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message);
      return { ok: false, error: errors.join(', ') };
    }

    const { cityId } = validationResult.data;

    // Attempt to change city using DAL function
    const result = await changeCity(user.id, cityId);

    return {
      ok: true,
      data: { revokedVerification: result.revokedVerification },
    };
  } catch (error: any) {
    // Handle cooldown period error
    if (error.message && error.message.includes('days')) {
      const match = error.message.match(/(\d+) days/);
      const cooldownDays = match ? parseInt(match[1]) : 0;
      return {
        ok: false,
        error: error.message,
        cooldownDays,
      };
    }

    const message = error?.message || 'Failed to change city';
    return { ok: false, error: message };
  }
}
