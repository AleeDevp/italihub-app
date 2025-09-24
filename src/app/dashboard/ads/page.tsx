import { AdListSkeleton } from '@/components/dashboard/skeleton';
import { requireUser } from '@/lib/require-user';
import { Suspense } from 'react';
import { AdsContent } from './_components/ads-content';

export const metadata = {
  title: 'My Ads - Dashboard',
};

interface AdsPageProps {
  searchParams: {
    status?: string;
    q?: string;
    page?: string;
    sort?: string;
  };
}

export default async function AdsPage({ searchParams }: AdsPageProps) {
  const user = await requireUser();

  const params = {
    status: searchParams.status,
    q: searchParams.q,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    sort: searchParams.sort as 'created-desc' | 'created-asc' | undefined,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Ads</h1>
        <p className="text-muted-foreground">
          Manage all your listings and track their performance
        </p>
      </div>

      <Suspense fallback={<AdListSkeleton />}>
        <AdsContent userId={user.id} params={params} />
      </Suspense>
    </div>
  );
}
