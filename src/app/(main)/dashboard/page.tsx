import { WidgetSkeleton } from '@/components/dashboard/skeleton';
import { PageLabel } from '@/components/page-label';
import { getRouteDefinition } from '@/config/routes';
import { requireUser } from '@/lib/auth/server';
import { Suspense } from 'react';
import { DashboardHome } from './_components/dashboard-home';

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboardRoute = getRouteDefinition('dashboard');

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageLabel
        icon={dashboardRoute.icon}
        title={dashboardRoute.name}
        description={dashboardRoute.description}
      />

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
