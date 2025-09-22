'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/lib/auth';
import { useSession } from '@/lib/auth-client';
import ProfileInformation from './_components/profile-information';

export default function DashboardPage() {
  const { data, isPending } = useSession();
  const user = data?.user as User;

  if (isPending || !user) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your account overview.</p>
        </div>
        <ProfileInformation user={user} />
      </div>
    </div>
  );
}
