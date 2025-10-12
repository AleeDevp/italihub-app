// Centralized auth entry. Prefer importing from '@/lib/auth/client' in Client Components
// and from '@/lib/auth/server' in Server Components and Route Handlers.

export { authToasts } from './auth-toasts';
export { logout } from './logout';

// Re-export types (types only, erased in runtime)
export type { Session, User } from './auth';
