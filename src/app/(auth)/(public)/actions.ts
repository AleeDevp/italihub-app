'use server';

import { auth } from '@/lib/auth';

export async function requestVerificationEmail(email: string) {
  const res = await auth.api.sendVerificationEmail({
    body: {
      email: email,
      callbackURL: '/email-verified',
    },
  });
  if (!res) {
    return { success: false, message: 'Something went wrong, try again later.' };
  }
  return { success: true, message: 'Verification email sent successfully.' };
}
