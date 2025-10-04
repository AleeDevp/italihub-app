'use server';

import { APIError } from 'better-auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthAuditor } from '../audit';
import { auth } from '../auth';

export type LoginState = {
  success: boolean;
  statusCode?: number;
  message: string | null;
};

export const signUp = async (email: string, password: string, name: string) => {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: '/email-verified',
      },
    });

    // Success case is handled by database hooks in auth.ts
    return {
      success: true,
      message: 'Signed up successfully!',
    };
  } catch (e) {
    // Log failure
    // const errorCode = e instanceof APIError ? `AUTH_${e.statusCode || 'ERROR'}` : 'SIGNUP_FAILURE';
    const errorMessage =
      e instanceof APIError ? e.message : 'Something went wrong, try again later.';

    // await AuthAuditor.logRegistrationFailure(email, errorCode, {
    //   failureReason: errorMessage,
    //   provider: 'email',
    // });

    return { success: false, message: errorMessage };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
        callbackURL: '/',
      },
    });

    // Success case is handled by database hooks in auth.ts
    return { success: true, message: 'Sign-in successful' };
  } catch (e) {
    // Log failure
    const errorCode = e instanceof APIError ? `AUTH_${e.statusCode || 'ERROR'}` : 'SIGNIN_FAILURE';
    let errorMessage = 'Something went wrong, try again later.';
    let statusCode;

    if (e instanceof APIError) {
      if (e.statusCode === 403) {
        errorMessage = 'Please verify your email.';
        statusCode = 403;
      } else {
        errorMessage = e.message;
      }
    }

    await AuthAuditor.logLoginFailure(email, errorCode, {
      failureReason: errorMessage,
      provider: 'email',
    });

    if (statusCode === 403) {
      return {
        success: false,
        statusCode: 403,
        message: errorMessage,
      };
    }
    return { success: false, message: errorMessage };
  }
};

export const signInSocial = async (provider: 'google' | 'facebook') => {
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
  } catch (e) {
    // Log OAuth failure
    const errorCode =
      e instanceof APIError ? `OAUTH_${e.statusCode || 'ERROR'}` : 'OAUTH_SIGNIN_FAILURE';
    const errorMessage = e instanceof APIError ? e.message : 'OAuth sign-in failed';

    await AuthAuditor.logOAuthFailure(
      provider === 'google' ? 'OAUTH_LINK_GOOGLE' : 'OAUTH_LINK_FACEBOOK',
      null, // No user ID on failure
      provider,
      errorCode,
      {
        failureReason: errorMessage,
        provider,
      }
    );

    throw e;
  }
};

export const signOut = async () => {
  try {
    // Success case is handled by database hooks in auth.ts when session is deleted
    await auth.api.signOut({ headers: await headers() });
  } catch (e) {
    // Log logout failure if needed
    const errorCode = e instanceof APIError ? `AUTH_${e.statusCode || 'ERROR'}` : 'SIGNOUT_FAILURE';
    console.error('Sign out failed:', e);
    throw e;
  }
};

export const linkSocialAccount = async () => {
  try {
    const result = await auth.api.linkSocialAccount({
      body: {
        provider: 'google',
      },
      headers: await headers(),
    });

    // Get current user for audit logging
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) {
      await AuthAuditor.logOAuthSuccess('OAUTH_LINK_GOOGLE', session.user.id, 'google', {
        accountLinked: true,
      });
    }

    return result;
  } catch (e) {
    // Get current user for audit logging
    const session = await auth.api.getSession({ headers: await headers() });
    const errorCode =
      e instanceof APIError ? `OAUTH_${e.statusCode || 'ERROR'}` : 'OAUTH_LINK_FAILURE';
    const errorMessage = e instanceof APIError ? e.message : 'OAuth linking failed';

    await AuthAuditor.logOAuthFailure(
      'OAUTH_LINK_GOOGLE',
      session?.user?.id || null,
      'google',
      errorCode,
      {
        failureReason: errorMessage,
      }
    );

    throw e;
  }
};

export const getAccountInfo = async (accountId: string) => {
  try {
    const result = await auth.api.accountInfo({
      body: { accountId },
      headers: await headers(),
    });
    return result;
  } catch (e) {
    throw e;
  }
};
