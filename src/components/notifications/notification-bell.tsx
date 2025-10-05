'use client';

import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/contexts/notification-context';
import { Bell } from 'lucide-react';
import { useMemo, useState } from 'react';

export function NotificationBell() {
  const { unreadCount, notifications, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const markVisibleNow = () => {
    const firstIds = notifications.slice(0, 15).map((n) => n.id);
    const unreadSet = new Set(notifications.filter((n) => !n.readAt).map((n) => n.id));
    const toMark = firstIds.filter((id) => unreadSet.has(id));
    if (toMark.length) markRead(toMark);
  };

  const badge = useMemo(() => {
    if (unreadCount <= 0) return null;
    return unreadCount > 99 ? '99+' : String(unreadCount);
  }, [unreadCount]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (open && !next) {
          // closing
          markVisibleNow();
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          className={`relative inline-flex items-center justify-center rounded-full p-2 hover:bg-accent transition ${
            unreadCount > 0 ? 'text-blue-600' : 'text-foreground'
          }`}
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6" />
          {badge && (
            <span className="absolute -top-1 -right-1 text-[10px] leading-none bg-red-500 text-white rounded-full px-1.5 py-0.5 shadow">
              {badge}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="p-0">
        <NotificationDropdown
          onClose={() => {
            markVisibleNow();
            setOpen(false);
          }}
          anchorRef={undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
