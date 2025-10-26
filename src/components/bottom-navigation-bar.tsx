'use client';

import AuthRequiredGate from '@/components/auth-required-gate';
import { ROUTE_DEFINITIONS } from '@/config/routes';
import { useIsMobile } from '@/hooks/use-mobile';
import { isActiveRoute } from '@/lib/route-utils';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type NavItem = {
  key: string;
  href: string;
  label: string;
  Icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

export function BottomNavigationBar() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const PROTECTED_KEYS = useMemo(() => new Set(['create-ad', 'ads-management', 'dashboard']), []);

  // Define nav items left-to-right from canonical route definitions with showInNav
  const items: NavItem[] = useMemo(() => {
    const navRoutes = ROUTE_DEFINITIONS.filter((r) => r.showInNav).sort(
      (a, b) => (a.navOrder ?? 999) - (b.navOrder ?? 999)
    );

    const createItem = (r: (typeof navRoutes)[number]): NavItem => ({
      key: r.key,
      href: r.url,
      label: r.name,
      Icon: r.icon,
      isActive: (p) => isActiveRoute(p, r.url),
    });

    const items = navRoutes.map(createItem);

    // Special-case dashboard: mark active only when other specific nav items aren't active
    const dashIdx = items.findIndex((i) => i.key === 'dashboard');
    if (dashIdx >= 0) {
      const others = items.filter((i) => i.key !== 'dashboard');
      const dash = items[dashIdx];
      items[dashIdx] = {
        ...dash,
        isActive: (p) => isActiveRoute(p, dash.href) && !others.some((o) => o.isActive(p)),
      };
    }

    return items;
  }, []);

  if (!isMobile) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50  flex items-center justify-center pb-[max(env(safe-area-inset-bottom),0px)]"
    >
      <div className="mx-auto w-dvw bg-white/60 backdrop-blur-md ring-1 ring-black/5">
        <ul className="grid grid-cols-4">
          {items.map(({ key, href, label, Icon, isActive }) => {
            const active = isActive(pathname || '/');
            const isProtected = PROTECTED_KEYS.has(key);

            const content = (
              <span
                className={`relative flex flex-col items-center justify-center gap-0.3 py-1 ${
                  active ? 'text-primary' : 'text-neutral-400'
                }`}
              >
                <motion.span
                  whileTap={{ scale: 0.92 }}
                  className="flex h-9 w-9 items-center justify-center"
                  animate={{ scale: active ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.4 }}
                >
                  <Icon className={`h-5 w-5 ${active ? '' : 'opacity-90'} transition-opacity`} />
                </motion.span>
                <span
                  className={`text-[11px] text-center leading-none line-clamp-1 ${active ? 'font-medium' : ''}`}
                >
                  {label}
                </span>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.span
                      layoutId="nav-active-underline"
                      className="absolute -bottom-[2px] h-1 w-6 rounded-full bg-black/15 "
                      transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.4 }}
                    />
                  )}
                </AnimatePresence>
              </span>
            );
            return (
              <li key={key}>
                {isProtected ? (
                  <AuthRequiredGate href={href} ariaCurrent={active ? 'page' : undefined}>
                    {content}
                  </AuthRequiredGate>
                ) : (
                  <Link href={href} aria-current={active ? 'page' : undefined}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export default BottomNavigationBar;
