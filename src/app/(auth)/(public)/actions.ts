'use server';

import { authError, authErrorFrom, authSuccess, type AuthResult } from '@/lib/auth/auth-errors';
import { auth } from '@/lib/auth/server';

type ActionResponse = AuthResult;

/**
 * Request a verification email to be sent to the specified email address
 */
export async function requestVerificationEmail(email: string): Promise<ActionResponse> {
  try {
    const res = await auth.api.sendVerificationEmail({
      body: {
        email: email,
        callbackURL: '/email-verified',
      },
    });

    if (!res) {
      return authError('Failed to send verification email', { code: 'NO_RESPONSE' });
    }

    return authSuccess();
  } catch (error) {
    return authErrorFrom(error, 'Failed to send verification email');
  }
}
