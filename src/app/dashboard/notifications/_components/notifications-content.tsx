import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listActiveAnnouncementsForUser } from '@/lib/dal/announcements';
import { listNotifications } from '@/lib/dal/notifications';
import { AlertCircle, Bell, CheckCircle, ExternalLink, Info, Mail, X } from 'lucide-react';

interface NotificationsContentProps {
  userId: string;
}

export async function NotificationsContent({ userId }: NotificationsContentProps) {
  const [notifications, announcements] = await Promise.all([
    listNotifications(userId, { page: 1, pageSize: 50 }),
    listActiveAnnouncementsForUser(userId),
  ]);

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {notifications.items.filter((n: any) => !n.readAt).length} unread notifications
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Announcements</h2>
          {announcements.map((announcement: any) => (
            <Card
              key={announcement.id}
              className={`border-l-4 ${getSeverityColor(announcement.severity)} ${announcement.pinned ? 'shadow-md' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(announcement.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{announcement.title}</h3>
                        {announcement.pinned && (
                          <Badge variant="secondary" className="text-xs">
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{announcement.body}</p>
                      {announcement.deepLink && (
                        <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Learn more
                        </Button>
                      )}
                    </div>
                  </div>
                  {announcement.dismissible && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Notifications</h2>

        {notifications.items.length > 0 ? (
          notifications.items.map((notification: any) => (
            <Card
              key={notification.id}
              className={`${!notification.readAt ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="relative">
                      {getSeverityIcon(notification.severity)}
                      {!notification.readAt && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        {!notification.readAt && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                      {notification.deepLink && (
                        <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View details
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {notification.readAt ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-muted-foreground">You have no notifications at the moment.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
