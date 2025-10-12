import { Widget } from '@/components/dashboard/widget';
import type { User } from '@/lib/auth/client';
import { getCityById } from '@/lib/cache/city-cache';
import { Shield, User as UserIcon } from 'lucide-react';

export interface ProfileWidgetProps {
  profile: User;
}

export async function ProfileWidget({ profile }: ProfileWidgetProps) {
  const userCityName = await getCityById(profile.cityId as number);
  return (
    <Widget
      title="Profile"
      description="Your account information"
      ctaLabel="Edit Profile"
      href="/dashboard/profile"
      icon={<UserIcon className="h-5 w-5" />}
    >
      <div className="space-y-2">
        <div>
          <p className="font-medium">{profile.name}</p>
          <p className="text-sm text-muted-foreground">@{profile.userId}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{userCityName?.name}</span>
          {profile.verified && (
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Verified</span>
            </div>
          )}
        </div>
      </div>
    </Widget>
  );
}
