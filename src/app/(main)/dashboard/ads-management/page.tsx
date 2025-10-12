import { AdListSkeleton } from '@/components/dashboard/skeleton';
import { PageLabel } from '@/components/page-label';
import { getRouteDefinition } from '@/config/routes';
import { Suspense } from 'react';
import { AdsManagementContent } from './_components/ads-management-content';

export default async function AdsManagementPage() {
  const adsRoute = getRouteDefinition('ads-management');
  return (
    <div className="w-full max-w-7xl mx-auto">
      <PageLabel icon={adsRoute.icon} title={adsRoute.name} description={adsRoute.description} />

      <Suspense fallback={<AdListSkeleton />}>
        <AdsManagementContent />
      </Suspense>
    </div>
  );
}
