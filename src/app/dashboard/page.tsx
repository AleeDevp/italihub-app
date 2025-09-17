'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/lib/auth';
import { useSession } from '@/lib/auth-client';
import { format } from 'date-fns';
import { CalendarDaysIcon, ShieldIcon, UserIcon } from 'lucide-react';

export default function DashboardPage() {
  const { data, isPending, refetch } = useSession();
  const user = data?.user as User;

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your account overview.</p>
        </div>
        <ProfileInformation user={user} />
      </div>
    </div>
  );
}

interface ProfileInformationProps {
  user: User;
}

function ProfileInformation({ user }: ProfileInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="size-5" />
          Profile Information
        </CardTitle>
        <CardDescription>Your account details and current status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image as string} alt={user.name} />
              <AvatarFallback className="text-muted-foreground">
                <UserIcon className="size-5" />
              </AvatarFallback>
            </Avatar>
            {user.role && (
              <Badge>
                <ShieldIcon className="size-3" />
                {user.role}
              </Badge>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-2xl font-semibold">{user.name}</h3>
              <p className="text-muted-foreground">{user.email}</p>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <CalendarDaysIcon className="size-4" />
                Member Since
              </div>
              <p className="font-medium">{format(user.createdAt, 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
