import { WidgetSkeleton } from '@/components/dashboard/skeleton';
import { requireUser } from '@/lib/require-user';
import { Suspense } from 'react';
import { VerificationContent } from './_components/verification-content';

export default async function VerificationPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Verification</h1>
        <p className="text-muted-foreground">Verify your identity to access advanced features.</p>
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
        <VerificationContent userId={user.id} />
      </Suspense>
    </div>
  );
}
