'use client';

import AuthRequiredGate from '@/components/auth-required-gate';
import { ROUTE_DEFINITIONS } from '@/config/routes';
import { isActiveRoute } from '@/lib/route-utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export function HeaderNavigationBar() {
  const pathname = usePathname() || '/';

  // Use canonical nav items
  const items = useMemo(
    () =>
      ROUTE_DEFINITIONS.filter((r) => r.showInNav)
        // Exclude "Home" from header nav
        .filter((r) => r.key !== 'home' && r.url !== '/' && r.name?.toLowerCase() !== 'home')
        .sort((a, b) => (a.navOrder ?? 999) - (b.navOrder ?? 999))
        .map((r) => ({
          key: r.key,
          href: r.url,
          label: r.name,
          Icon: r.icon,
          active: isActiveRoute(pathname, r.url),
        })),
    [pathname]
  );

  return (
    <nav aria-label="Primary desktop" className="hidden md:block">
      <div className="rounded-full py-0.5">
        <ul className="flex items-center gap-1.5">
          {items.map(({ key, href, label, Icon, active }) => {
            const protectedKey = key === 'post-ad' || key === 'ads' || key === 'dashboard';
            const content = (
              <span
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs border ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10
                  ${
                    active
                      ? 'bg-gradient-to-b from-white to-white/90 text-foreground shadow border-white/70 ring-black/5'
                      : 'bg-gradient-to-b from-white/90 to-white/70 text-muted-foreground hover:text-foreground hover:from-white hover:to-white/80 border-white/40 ring-white/60 shadow-sm'
                  }
                `}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? '' : 'opacity-80'}`} aria-hidden />
                <span className={`tracking-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </span>
            );
            return (
              <li key={key}>
                {protectedKey ? (
                  <AuthRequiredGate href={href}>{content}</AuthRequiredGate>
                ) : (
                  <Link href={href}>{content}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export default HeaderNavigationBar;
