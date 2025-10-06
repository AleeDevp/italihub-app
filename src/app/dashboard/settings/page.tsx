import { WidgetSkeleton } from '@/components/dashboard/skeleton';
import { getServerSession } from '@/lib/get-session';
import { Suspense } from 'react';
import { SettingsContent } from './_components/settings-content';

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) {
    throw new Error('User is not authenticated');
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="my-6">
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
        <SettingsContent session={session} />
      </Suspense>
    </div>
  );
}
