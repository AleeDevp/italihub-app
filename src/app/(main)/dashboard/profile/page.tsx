import { ProfileSkeleton } from '@/components/dashboard/skeleton';
import { PageLabel } from '@/components/page-label';
import { getRouteDefinition } from '@/config/routes';
import { requireUser } from '@/lib/auth/server';
import { Suspense } from 'react';
import { ProfileContent } from './_components/profile-content';

export const metadata = {
  title: 'Profile - Dashboard',
};

export default async function ProfilePage() {
  const user = await requireUser();
  const profileRoute = getRouteDefinition('profile');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <PageLabel
        icon={profileRoute.icon}
        title={profileRoute.name}
        description={profileRoute.description}
      />

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent user={user} />
      </Suspense>
    </div>
  );
}
