'use client';

import { LoadingSpinner } from '@/components/loading-spinner';
import { NotificationListItem } from '@/components/notifications/notification-variants';
import { useNotifications } from '@/contexts/notification-context';
import { X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export function NotificationSidebar({
  onClose,
  isClosing = false,
}: {
  onClose: () => void;
  isClosing?: boolean;
}) {
  const { notifications, markRead, loadMore, hasMore, isLoading } = useNotifications();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const [loadingMore, setLoadingMore] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // Ensure visibleCount never exceeds loaded notifications
  useEffect(() => {
    setVisibleCount((v) => Math.min(v, notifications.length || v));
  }, [notifications.length]);

  const canLoadMore = useMemo(
    () => visibleCount < notifications.length || hasMore,
    [visibleCount, notifications.length, hasMore]
  );

  async function onLoadMoreClick() {
    if (loadingMore) return;
    setLoadingMore(true);
    // Increase visible window to reveal newly loaded items when they arrive
    setVisibleCount((v) => v + 15);
    try {
      await loadMore();
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div
      className={
        'fixed inset-y-0 right-0 z-50 w-[90vw] max-w-md bg-popover text-popover-foreground shadow-xl border-l flex flex-col transform transition-transform duration-300 ' +
        (isClosing ? 'translate-x-full' : entered ? 'translate-x-0' : 'translate-x-full')
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="font-medium">Notifications</div>
        <button
          aria-label="Close"
          className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={() => {
            onClose();
          }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading notifications…</div>
        ) : (
          <ul className="space-y-1 p-2">
            {notifications.slice(0, visibleCount).map((n) => (
              <NotificationListItem
                key={n.id}
                item={n}
                onNavigate={() => {
                  // Mark the clicked notification as read before navigating
                  markRead([n.id]);
                  // Close the sidebar for immediate UI feedback
                  onClose();
                }}
              />
            ))}
          </ul>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">No notifications yet</div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-2 flex items-center justify-between">
        {canLoadMore ? (
          <button
            className="px-3 py-1.5 text-sm hover:bg-accent rounded inline-flex items-center gap-2 disabled:opacity-60"
            onClick={onLoadMoreClick}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <LoadingSpinner size="sm" variant="ring" aria-hidden />
                <span>Loading…</span>
              </>
            ) : (
              'Load more'
            )}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground px-1.5">End of notifications</span>
        )}
        <button
          className="text-xs text-muted-foreground hover:underline"
          onClick={() => {
            onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
