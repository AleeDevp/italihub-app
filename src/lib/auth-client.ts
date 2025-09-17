//The client-side library helps you interact with the auth server.

import { inferAdditionalFields } from 'better-auth/client/plugins';
import { nextCookies } from 'better-auth/next-js';
import { createAuthClient } from 'better-auth/react';
import { auth } from './auth';

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), nextCookies()], // !! nextCCookies always be the last item in the array
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
});

export const { signUp, signIn, signOut, useSession, linkSocial } = authClient;
