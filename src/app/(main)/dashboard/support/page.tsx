import { WidgetSkeleton } from '@/components/dashboard/skeleton';
import { PageLabel } from '@/components/page-label';
import { getRouteDefinition } from '@/config/routes';
import { requireUser } from '@/lib/auth/server';
import { Suspense } from 'react';
import { SupportContent } from './_components/support-content';

export default async function SupportPage() {
  const user = await requireUser();
  const supportRoute = getRouteDefinition('support');

  return (
    <div className="w-full max-w-7xl mx-auto">
      <PageLabel
        icon={supportRoute.icon}
        title={supportRoute.name}
        description={supportRoute.description}
      />

      <Suspense
        fallback={
          <div className="space-y-4">
            <WidgetSkeleton />
            <WidgetSkeleton />
            <WidgetSkeleton />
          </div>
        }
      >
        <SupportContent userId={user.id} />
      </Suspense>
    </div>
  );
}
