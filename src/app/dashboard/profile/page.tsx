import { ProfileSkeleton } from '@/components/dashboard/skeleton';
import { getCityById } from '@/lib/cache/city-cache';
import { requireUser } from '@/lib/require-user';
import { Suspense } from 'react';
import { ProfileContent } from './_components/profile-content';

export const metadata = {
  title: 'Profile - Dashboard',
};

export default async function ProfilePage() {
  const user = await requireUser();
  const userCity = user.cityId ? await getCityById(user.cityId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account information and settings</p>
      </div>

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent user={user} cityName={userCity?.name} />
      </Suspense>
    </div>
  );
}
