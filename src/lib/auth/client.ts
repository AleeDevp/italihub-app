// Client-only auth exports. This module must be safe to import from Client Components.
// Do not re-export any server-only code (next/headers, server-only, prisma, etc.).

export {
  authClient,
  getSession,
  linkSocial,
  signIn,
  signOut,
  signUp,
  useSession,
} from './auth-client';

export { authToasts } from './auth-toasts';
export { logout } from './logout';

// Re-export types only (erased at compile time, no runtime import)
export type { Session, User } from './auth';
