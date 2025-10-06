import { ProfileSkeleton } from '@/components/dashboard/skeleton';
import { requireUser } from '@/lib/require-user';
import { Suspense } from 'react';
import { ProfileContent } from './_components/profile-content';

export const metadata = {
  title: 'Profile - Dashboard',
};

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="my-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account information and settings</p>
      </div>

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent user={user} />
      </Suspense>
    </div>
  );
}
