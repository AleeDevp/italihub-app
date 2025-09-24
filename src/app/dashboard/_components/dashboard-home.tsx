import { StatChip } from '@/components/dashboard/stat-chip';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Widget } from '@/components/dashboard/widget';
import { getUserAdStats, listUserAds } from '@/lib/dal/ads';
import { getUnreadCount } from '@/lib/dal/notifications';
import { getUserProfileData } from '@/lib/dal/user';
import { getLatestVerification } from '@/lib/dal/verification';
import {
  BarChart3,
  Bell,
  Eye,
  FileText,
  MessageCircle,
  Settings,
  Shield,
  User,
} from 'lucide-react';

interface DashboardHomeProps {
  userId: string;
}

export async function DashboardHome({ userId }: DashboardHomeProps) {
  // Fetch all dashboard data in parallel
  const [adStats, recentAds, profile, unreadCount, verification] = await Promise.all([
    getUserAdStats(userId),
    listUserAds({ userId, pageSize: 3 }),
    getUserProfileData(userId), // Use getUserProfileData from user DAL
    getUnreadCount(userId),
    getLatestVerification(userId),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Overview Widget */}
      <Widget
        title="Overview"
        description="Ad statistics and performance"
        ctaLabel="View Details"
        href="/dashboard/overview"
        icon={<BarChart3 className="h-5 w-5" />}
      >
        <div className="flex flex-wrap gap-2">
          <StatChip label="Online" count={adStats.online} variant="default" />
          <StatChip label="Pending" count={adStats.pending} variant="secondary" />
          <StatChip label="Rejected" count={adStats.rejected} variant="destructive" />
          <StatChip label="Expired" count={adStats.expired} variant="outline" />
        </div>
      </Widget>

      {/* Ads Management Widget */}
      <Widget
        title="My Ads"
        description="Manage your listings"
        ctaLabel="View All Ads"
        href="/dashboard/ads"
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="space-y-2">
          {recentAds.items.slice(0, 3).map((ad) => (
            <div key={ad.id} className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{ad.title || `${ad.category} Ad`}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {ad.viewsCount}
                  <MessageCircle className="h-3 w-3" />
                  {ad.contactClicksCount}
                </div>
              </div>
              <StatusBadge status={ad.status} />
            </div>
          ))}
          {recentAds.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No ads yet</p>
          )}
        </div>
      </Widget>

      {/* Profile Widget */}
      <Widget
        title="Profile"
        description="Your account information"
        ctaLabel="Edit Profile"
        href="/dashboard/profile"
        icon={<User className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <div>
            <p className="font-medium">{profile.name}</p>
            <p className="text-sm text-muted-foreground">@{profile.userId}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{profile.cityName}</span>
            {profile.verified && (
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">Verified</span>
              </div>
            )}
          </div>
        </div>
      </Widget>

      {/* Verification Widget */}
      <Widget
        title="Verification"
        description={profile.verified ? "You're verified!" : 'Get verified to unlock all features'}
        ctaLabel={profile.verified ? 'View Status' : 'Get Verified'}
        href="/dashboard/verification"
        icon={<Shield className="h-5 w-5" />}
      >
        <div className="space-y-2">
          {profile.verified ? (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Verified</span>
            </div>
          ) : verification?.status === 'PENDING' ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-sm text-yellow-600 font-medium">Review in Progress</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Complete verification to access currency exchange and other premium features.
            </div>
          )}
        </div>
      </Widget>

      {/* Notifications Widget */}
      <Widget
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up!'}
        ctaLabel="View All"
        href="/dashboard/notifications"
        icon={<Bell className="h-5 w-5" />}
      >
        <div className="space-y-2">
          {unreadCount > 0 ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium">{unreadCount} new notifications</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No new notifications</p>
          )}
        </div>
      </Widget>

      {/* Settings Widget */}
      <Widget
        title="Settings"
        description="Account and privacy settings"
        ctaLabel="Manage Settings"
        href="/dashboard/settings"
        icon={<Settings className="h-5 w-5" />}
      >
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>• Change email & password</p>
          <p>• Privacy preferences</p>
          <p>• Account management</p>
        </div>
      </Widget>
    </div>
  );
}
