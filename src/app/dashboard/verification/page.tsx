import { TableSkeleton } from '@/components/dashboard/skeleton';
import { requireUser } from '@/lib/require-user';
import { Suspense } from 'react';
import { VerificationContent } from './_components/verification-content';

export default async function VerificationPage() {
  const user = await requireUser();

  return (
    <div className=" w-full max-w-7xl mx-auto">
      <div className="my-6">
        <h1 className="text-3xl font-bold">Account Verification</h1>
        <p className="text-muted-foreground">
          Verify your identity verification to unlock all ItaliaHub features and build trust with
          other users.
        </p>
      </div>

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
