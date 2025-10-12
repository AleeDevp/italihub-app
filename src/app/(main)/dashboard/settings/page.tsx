import { WidgetSkeleton } from '@/components/dashboard/skeleton';
import { PageLabel } from '@/components/page-label';
import { getRouteDefinition } from '@/config/routes';
import { requireUser } from '@/lib/auth/server';
import { Suspense } from 'react';
import { SettingsContent } from './_components/settings-content';

export default async function SettingsPage() {
  const user = await requireUser();
  const settingsRoute = getRouteDefinition('settings');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <PageLabel
        icon={settingsRoute.icon}
        title={settingsRoute.name}
        description={settingsRoute.description}
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
        <SettingsContent />
      </Suspense>
    </div>
  );
}
