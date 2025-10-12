// Server-only auth exports. Safe to import in Server Components, Route Handlers, and Server Actions.
import 'server-only';

export { auth } from './auth';
export { getServerSession } from './get-session';
export { getCurrentUser, requireUser } from './require-user';

// Re-export types
export type { Session, User } from './auth';
