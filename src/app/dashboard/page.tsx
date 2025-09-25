import { WidgetSkeleton } from '@/components/dashboard/skeleton';
import { requireUser } from '@/lib/require-user';
import { Suspense } from 'react';
import { DashboardHome } from './_components/dashboard-home';

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">Here's an overview of your ItaliaHub activity</p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <WidgetSkeleton key={i} />
            ))}
          </div>
        }
      >
        <DashboardHome user={user} />
      </Suspense>
    </div>
  );
}
