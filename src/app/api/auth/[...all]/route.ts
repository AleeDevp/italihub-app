import { auth } from '@/lib/auth/server'; // server-only auth
import { toNextJsHandler } from 'better-auth/next-js';

export const { POST, GET } = toNextJsHandler(auth);
