'use client';

import { useSession } from '@/lib/auth/client';

export function useIsAuthed() {
  const { data } = useSession();
  return !!data?.user?.id;
}
