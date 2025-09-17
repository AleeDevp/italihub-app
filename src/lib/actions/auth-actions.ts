'use server';

import { APIError } from 'better-auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '../auth';

export type LoginState = {
  success: boolean;
  statusCode?: number;
  message: string | null;
};

export const signUp = async (email: string, password: string, name: string) => {
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: '/email-verified',
      },
    });
    return {
      success: true,
      message: 'Signed up successfully!',
    };
  } catch (e) {
    if (e instanceof APIError) {
      return { success: false, message: e.message };
    }
    return { success: false, message: 'Something went wrong, try again later.' };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
        callbackURL: '/',
      },
    });
    return { success: true, message: 'Sign-in successful' };
  } catch (e) {
    if (e instanceof APIError) {
      if (e.statusCode === 403) {
        return {
          success: false,
          statusCode: 403,
          message: 'Please verify your email.',
        };
      }
      return { success: false, message: e.message };
    }
    return { success: false, message: 'Something went wrong, try again later.' };
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
    throw e;
  }
};

export const signOut = async () => {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (e) {
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
    return result;
  } catch (e) {
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
