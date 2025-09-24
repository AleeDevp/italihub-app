import { WidgetSkeleton } from '@/components/dashboard/skeleton';
import { requireUser } from '@/lib/require-user';
import { Suspense } from 'react';
import { SettingsContent } from './_components/settings-content';

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and security settings.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <WidgetSkeleton />
            <WidgetSkeleton />
            <WidgetSkeleton />
          </div>
        }
      >
        <SettingsContent userId={user.id} />
      </Suspense>
    </div>
  );
}
