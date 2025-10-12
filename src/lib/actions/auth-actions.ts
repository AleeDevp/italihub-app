'use server';

import {
  authErrorFrom,
  authSuccess,
  parseAuthError,
  type AuthResult,
} from '@/lib/auth/auth-errors';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthAuditor } from '../audit/audit';

export type AuthActionResult<T = void> = AuthResult<T>;

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  name: string
): Promise<AuthActionResult> => {
  const requestHeaders = await headers();

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: '/email-verified',
      },
      headers: requestHeaders,
    });

    return authSuccess();
  } catch (error) {
    return authErrorFrom(error, 'Unable to complete sign up');
  }
};

/**
 * Sign in a user with email and password
 */
export const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
  const requestHeaders = await headers();

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
        callbackURL: '/',
      },
      headers: requestHeaders,
    });

    return authSuccess();
  } catch (error) {
    const authError = parseAuthError(error, 'Unable to sign in');

    await AuthAuditor.logLoginFailure(email, authError.code ?? 'SIGNIN_FAILURE', {
      failureReason: authError.message,
      provider: 'email',
    });

    return {
      ok: false,
      error: authError,
    };
  }
};

/**
 * Sign in with a social provider (Google, Facebook)
 * Redirects to the provider's OAuth page
 */
export const signInSocial = async (provider: 'google' | 'facebook'): Promise<void> => {
  try {
    const { url } = await auth.api.signInSocial({
      body: {
        provider,
        callbackURL: '/',
      },
    });

    if (url) {
      redirect(url);
    }
  } catch (error) {
    const authError = parseAuthError(error, 'OAuth sign-in failed');

    // Log OAuth failure for audit purposes
    await AuthAuditor.logOAuthFailure(
      provider === 'google' ? 'OAUTH_LINK_GOOGLE' : 'OAUTH_LINK_FACEBOOK',
      null,
      provider,
      authError.code ?? 'OAUTH_SIGNIN_FAILURE',
      {
        failureReason: authError.message,
        provider,
      }
    );

    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<AuthActionResult> => {
  const requestHeaders = await headers();

  try {
    await auth.api.signOut({ headers: requestHeaders });
    return authSuccess();
  } catch (error) {
    const authError = parseAuthError(error, 'Sign out failed');
    console.error('[Sign Out] Failed:', authError);
    return {
      ok: false,
      error: authError,
    };
  }
};

/**
 * Link a social account (Google) to the current user's account
 */
export const linkSocialAccount = async (): Promise<AuthActionResult> => {
  const requestHeaders = await headers();

  try {
    await auth.api.linkSocialAccount({
      body: {
        provider: 'google',
      },
      headers: requestHeaders,
    });

    const session = await auth.api.getSession({ headers: requestHeaders });
    if (session?.user) {
      await AuthAuditor.logOAuthSuccess('OAUTH_LINK_GOOGLE', session.user.id, 'google', {
        accountLinked: true,
      });
    }

    return authSuccess();
  } catch (error) {
    const authError = parseAuthError(error, 'Failed to link account');
    let sessionUserId: string | null = null;

    try {
      const session = await auth.api.getSession({ headers: requestHeaders });
      sessionUserId = session?.user?.id ?? null;
    } catch {
      sessionUserId = null;
    }

    await AuthAuditor.logOAuthFailure(
      'OAUTH_LINK_GOOGLE',
      sessionUserId,
      'google',
      authError.code ?? 'OAUTH_LINK_FAILURE',
      {
        failureReason: authError.message,
      }
    );

    return {
      ok: false,
      error: authError,
    };
  }
};

/**
 * Get account information for a specific account ID
 */
export const getAccountInfo = async (accountId: string): Promise<AuthActionResult> => {
  const requestHeaders = await headers();

  try {
    await auth.api.accountInfo({
      body: { accountId },
      headers: requestHeaders,
    });

    return authSuccess();
  } catch (error) {
    return authErrorFrom(error, 'Failed to retrieve account info');
  }
};
