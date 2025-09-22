import { APIError } from 'better-auth/api';
import { cache } from 'react';
import 'server-only';
import type { User } from './auth';
import { getServerSession } from './get-session';

// Returns the current user if authenticated, otherwise null.
// Memoized per-request using React cache to avoid duplicate auth lookups.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getServerSession();
  return session?.user ?? null;
});

// Ensures a user is authenticated. If not, throws a 401 APIError.
// Memoized per-request so multiple calls in a single request are cheap.
export const requireUser = cache(async (): Promise<User> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new APIError('UNAUTHORIZED', { message: 'Not authenticated' });
  }
  return user;
});
