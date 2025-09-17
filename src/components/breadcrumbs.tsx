'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  className?: string;
};

function toTitleCase(segment: string) {
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function Breadcrumbs({ className }: Props) {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  const items: { label: string; href: string; isActive: boolean }[] = [];

  // Home always first
  items.push({ label: 'Home', href: '/', isActive: pathname === '/' });

  let current = '';
  pathSegments.forEach((segment, index) => {
    current += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    items.push({ label: toTitleCase(segment), href: current, isActive: isLast });
  });

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, idx) => (
          <div key={item.href} className="flex items-center">
            {idx > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isActive ? (
                <>
                  {item.label === 'Home' && <Home className="size-4" />}
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                </>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>
                    {item.label === 'Home' && <Home className="mr-1 size-4" />}
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
