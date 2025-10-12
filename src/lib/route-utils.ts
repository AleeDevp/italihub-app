import { ROUTE_DEFINITIONS, type AppRoute } from '@/config/routes';

export type RouteKey = AppRoute['key'] | 'unknown';

// Match longest url first (more specific routes before general)
const ORDERED_ROUTES = [...ROUTE_DEFINITIONS].sort((a, b) => b.url.length - a.url.length);

export type RouteInfo = {
  key: RouteKey;
  title: string;
  href: string;
};

function humanizePath(pathname: string): string {
  if (!pathname || pathname === '/') return 'Home';
  const parts = pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1] || 'Unknown';
  return last.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export function getRouteInfo(pathname: string): RouteInfo {
  const route = ORDERED_ROUTES.find((r) =>
    r.url === '/' ? pathname === '/' : pathname === r.url || pathname.startsWith(r.url + '/')
  );
  if (route) return { key: route.key, title: route.name, href: route.url };
  return { key: 'unknown', title: humanizePath(pathname), href: pathname };
}

export function isActiveRoute(pathname: string, keyOrHref: RouteKey | string): boolean {
  if (keyOrHref.startsWith('/')) {
    // href comparison: exact for '/', startsWith for others
    if (keyOrHref === '/') return pathname === '/';
    return (
      pathname === keyOrHref ||
      pathname.startsWith(keyOrHref + '/') ||
      pathname.startsWith(keyOrHref)
    );
  }
  const info = getRouteInfo(pathname);
  return info.key === (keyOrHref as RouteKey);
}
