'use client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import type { User } from '@/lib/auth';
import { format } from 'date-fns';
import { CalendarDaysIcon, MailIcon, MapPinIcon, ShieldIcon, UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  user: User;
};

export default function ProfileInformation({ user }: Props) {
  const router = useRouter();
  const [cityName, setCityName] = useState<string>('Not set');

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const res = await fetch('/api/user/user-city', { cache: 'no-store' });
        const json = (await res.json()) as { cityName?: string };
        if (!active) return;
        setCityName(json.cityName ?? 'Not set');
      } catch {
        if (!active) return;
        setCityName('Not set');
      }
    }
    run();
    return () => {
      active = false;
    };
  }, []);

  const cityLabel = useMemo(() => cityName, [cityName]);

  return (
    <Card
      role="button"
      tabIndex={0}
      className="group relative overflow-hidden border bg-card/60 backdrop-blur transition hover:border-primary/40 hover:shadow-md"
      onClick={() => router.push('/dashboard/profile')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') router.push('/dashboard/profile');
      }}
    >
      <CardContent className="flex items-center gap-4 p-5 sm:p-6">
        <div className="relative">
          <UserAvatar image={user.image ?? null} className="h-14 w-14" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold leading-tight">{user.name}</h3>
            {user.role === 'admin' && (
              <Badge variant="secondary" className="gap-1">
                <ShieldIcon className="size-3" />
                {user.role}
              </Badge>
            )}
          </div>

          <div className="mt-1 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <MailIcon className="size-4" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="size-4" />
              <span>Member since {format(user.createdAt, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-4" />
              <span>{cityLabel}</span>
            </div>
            {user.userId && (
              <div className="flex items-center gap-2">
                <UserIcon className="size-4" />
                <span>@{user.userId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto hidden text-xs text-muted-foreground sm:block">View profile →</div>
      </CardContent>
    </Card>
  );
}
