import { getUserAdStats, listUserAds } from '@/lib/dal/ads';
import { getUnreadCount } from '@/lib/dal/notifications';
// import { getUserProfileData } from '@/lib/dal/user';
import { User } from '@/lib/auth';
import { getLatestVerification } from '@/lib/dal/verification';
import {
  AdsWidget,
  NotificationsWidget,
  OverviewWidget,
  ProfileWidget,
  SettingsWidget,
  VerificationWidget,
} from './widgets';

interface DashboardHomeProps {
  user: User;
}

export async function DashboardHome({ user }: DashboardHomeProps) {
  // Fetch all dashboard data in parallel
  const [adStats, recentAds, profile, unreadCount, verification] = await Promise.all([
    getUserAdStats(user.id),
    listUserAds({ userId: user.id, pageSize: 3 }),
    user,
    getUnreadCount(user.id),
    getLatestVerification(user.id),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <OverviewWidget stats={adStats} />
      <AdsWidget ads={recentAds.items} />
      <ProfileWidget profile={profile} />
      <VerificationWidget
        verified={profile.verified}
        verificationStatus={verification?.status ?? null}
      />
      <NotificationsWidget unreadCount={unreadCount} />
      <SettingsWidget />
    </div>
  );
}
