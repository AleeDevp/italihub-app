'use client';

import { getSession, signOut } from './auth-client';

export type LogoutResult = {
  success: boolean;
  error?: string;
};

/**
 * Performs client-side logout using Better Auth, waits for session propagation,
 * and verifies the session is cleared. Returns a success flag and optional error.
 */
export async function logout(waitMs = 100): Promise<LogoutResult> {
  try {
    await signOut();
    // allow session changes to propagate to client
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
    const result = await getSession();
    const data: any = (result as any)?.data ?? null;
    const isLoggedOut = !data?.user;
    if (!isLoggedOut) {
      return { success: false, error: 'Session still active after sign out' };
    }
    return { success: true };
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to log out';
    return { success: false, error: message };
  }
}
