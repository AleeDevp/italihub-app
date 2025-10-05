'use client';

import { NotificationListItem } from '@/components/notifications/notification-variants';
import { useNotifications } from '@/contexts/notification-context';
import { useEffect, useRef } from 'react';

export function NotificationDropdown({
  onClose,
  anchorRef,
}: {
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}) {
  const { notifications, markRead, loadMore, hasMore, isLoading, loadInitial } = useNotifications();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep latest notifications and markRead in refs so cleanup can use current values
  const latestRef = useRef({ notifications });
  useEffect(() => {
    latestRef.current.notifications = notifications;
  }, [notifications]);
  const markReadRef = useRef(markRead);
  useEffect(() => {
    markReadRef.current = markRead;
  }, [markRead]);

  // Mark visible notifications as read (first 15 only)
  const markVisibleNow = () => {
    const current = latestRef.current.notifications;
    const firstIds = current.slice(0, 15).map((n) => n.id);
    const unreadSet = new Set(current.filter((n) => !n.readAt).map((n) => n.id));
    const toMark = firstIds.filter((id) => unreadSet.has(id));
    if (toMark.length) markReadRef.current(toMark);
  };

  // Close on genuine outside clicks only (not when interacting inside dropdown)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      const insideDrop = containerRef.current?.contains(target);
      const onAnchor = anchorRef?.current?.contains(target);
      if (insideDrop || onAnchor) return;
      markVisibleNow();
      onClose();
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        markVisibleNow();
        onClose();
      }
    }
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose, anchorRef]);

  // When user clicks the bell button to close while open, mark before parent closes
  useEffect(() => {
    const anchor = anchorRef?.current;
    if (!anchor) return;
    const onAnchorClick = () => {
      // Dropdown exists only when open, so this run corresponds to closing via bell
      markVisibleNow();
    };
    anchor.addEventListener('click', onAnchorClick, true);
    return () => {
      anchor.removeEventListener('click', onAnchorClick, true);
    };
  }, [anchorRef]);

  // Initial load is now handled by the provider when a session is present.

  return (
    <div
      ref={containerRef}
      className="absolute right-0 mt-2 w-70 md:w-96 max-h-[70vh] overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg z-50"
    >
      <div className="p-3 border-b font-medium">Notifications</div>
      {isLoading ? (
        <div className="p-4 text-sm text-muted-foreground">Loading notifications…</div>
      ) : (
        <ul className="space-y-1 p-2">
          {notifications.slice(0, 15).map((n) => (
            <NotificationListItem key={n.id} item={n} />
          ))}
        </ul>
      )}
      {!isLoading && notifications.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground">No notifications yet</div>
      )}
      {hasMore && (
        <button className="w-full p-3 text-sm hover:bg-accent" onClick={() => loadMore()}>
          Load more
        </button>
      )}
      <div className="p-2 text-right">
        <button
          className="text-xs text-muted-foreground hover:underline"
          onClick={() => {
            markVisibleNow();
            onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
