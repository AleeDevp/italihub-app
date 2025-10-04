import { headers } from 'next/headers';
import { cache } from 'react';
import { auth } from './auth';

export const getServerSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});

// TODO: Delete this, There is already requireUser in require-user.ts for getting user data
