'use client';

import { PageLabel } from '@/components/page-label';
import { getRouteDefinition } from '@/config/routes';
import { CreateAdContent } from './_components/create-ad-content';

export default function CreateAdPage() {
  const createAdRoute = getRouteDefinition('create-ad');

  return (
    <div className="w-full max-w-7xl mx-auto px-0 md:px-8">
      <PageLabel
        icon={createAdRoute.icon}
        title={createAdRoute.name}
        description={createAdRoute.description}
      />
      <CreateAdContent />
    </div>
  );
}
