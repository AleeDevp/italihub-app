'use client';

import { getRouteInfo } from '@/lib/route-utils';
import { usePathname } from 'next/navigation';

export function useRouteInfo() {
  const pathname = usePathname() || '/';
  return getRouteInfo(pathname);
}
