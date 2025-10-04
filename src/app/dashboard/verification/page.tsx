import { WidgetSkeleton } from '@/components/dashboard/skeleton';
import { getCityById } from '@/lib/cache/city-cache';
import { requireUser } from '@/lib/require-user';
import { Suspense } from 'react';
import { VerificationContent } from './_components/verification-content';

export default async function VerificationPage() {
  const user = await requireUser();

  // Get the city information for the user
  const city = user.cityId ? await getCityById(user.cityId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Verification</h1>
        <p className="text-muted-foreground">
          Verify your identity verification to unlock all ItaliaHub features and build trust with
          other users.
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
        <VerificationContent userId={user.id} userName={user.name} cityName={city?.name} />
      </Suspense>
    </div>
  );
}
