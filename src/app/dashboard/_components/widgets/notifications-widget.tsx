import { Widget } from '@/components/dashboard/widget';
import { Bell } from 'lucide-react';

export interface NotificationsWidgetProps {
  unreadCount: number;
}

export function NotificationsWidget({ unreadCount }: NotificationsWidgetProps) {
  return (
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
  );
}
