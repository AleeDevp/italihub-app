import { TableSkeleton } from '@/components/dashboard/skeleton';
import { PageLabel } from '@/components/page-label';
import { getRouteDefinition } from '@/config/routes';
import { requireUser } from '@/lib/auth/server';
import { Suspense } from 'react';
import { VerificationContent } from './_components/verification-content';

export default async function VerificationPage() {
  const user = await requireUser();
  const verificationRoute = getRouteDefinition('verification');

  return (
    <div className="w-full max-w-7xl mx-auto">
      <PageLabel
        icon={verificationRoute.icon}
        title={verificationRoute.name}
        description={verificationRoute.description}
      />

      <Suspense
        fallback={
          <div className="space-y-4">
            <TableSkeleton />
          </div>
        }
      >
        <VerificationContent user={user} />
      </Suspense>
    </div>
  );
}
