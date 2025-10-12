import { PageLabel } from '@/components/page-label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRouteDefinition } from '@/config/routes';
import { requireUser } from '@/lib/auth/server';
import { Suspense } from 'react';
import { NotificationsContent } from './_components/notifications-content';

export const metadata = {
  title: 'Notifications - Dashboard',
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const notificationsRoute = getRouteDefinition('notifications');

  return (
    <div className="w-full max-w-7xl mx-auto">
      <PageLabel
        icon={notificationsRoute.icon}
        title={notificationsRoute.name}
        description={notificationsRoute.description}
      />

      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent userId={user.id} />
      </Suspense>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
