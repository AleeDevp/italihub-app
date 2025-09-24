import { WidgetSkeleton } from '@/components/dashboard/skeleton';
import { requireUser } from '@/lib/require-user';
import { Suspense } from 'react';
import { SupportContent } from './_components/support-content';

export default async function SupportPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground">Get help with your account or report an issue.</p>
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
        <SupportContent userId={user.id} />
      </Suspense>
    </div>
  );
}
