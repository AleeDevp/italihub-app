'use client';

import { NotificationSidebar } from '@/components/notifications/notification-sidebar';
import { useNotifications } from '@/contexts/notification-context';
import { Bell } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export function NotificationBell() {
  const { unreadCount, notifications, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [animatingIn, setAnimatingIn] = useState(false);
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

  // Lock body scroll while sidebar is open and compensate for scrollbar to avoid layout shift
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const docEl = document.documentElement;
    if (open) {
      const prevOverflow = body.style.overflow;
      const prevPaddingRight = body.style.paddingRight;
      const scrollBarWidth = Math.max(0, window.innerWidth - docEl.clientWidth);
      body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;
      return () => {
        body.style.overflow = prevOverflow;
        body.style.paddingRight = prevPaddingRight;
      };
    }
  }, [open]);

  return (
    <>
      <button
        className={`relative inline-flex items-center justify-center rounded-full p-2  transition ${
          unreadCount > 0 ? 'text-blue-600' : 'text-foreground'
        }`}
        aria-label="Notifications"
        onClick={() => {
          setOpen(true);
          // start fade-in backdrop
          requestAnimationFrame(() => setAnimatingIn(true));
        }}
      >
        <Bell className="h-5 w-5" />
        {badge && (
          <span className="absolute -top-1 -right-1 text-[10px] leading-none bg-red-500 text-white rounded-full px-1.5 py-0.5 shadow">
            {badge}
          </span>
        )}
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <>
              {/* Backdrop */}
              <div
                className={`fixed inset-0 z-[1000] bg-black/30 transition-opacity duration-300 ${
                  animatingOut ? 'opacity-0' : animatingIn ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={() => {
                  setAnimatingOut(true);
                  setTimeout(() => {
                    markVisibleNow();
                    setOpen(false);
                    setAnimatingOut(false);
                    setAnimatingIn(false);
                  }, 250);
                }}
              />
              {/* Sidebar */}
              <div className="fixed inset-0 z-[1001] pointer-events-none">
                <div className="pointer-events-auto">
                  <NotificationSidebar
                    isClosing={animatingOut}
                    onClose={() => {
                      setAnimatingOut(true);
                      setTimeout(() => {
                        markVisibleNow();
                        setOpen(false);
                        setAnimatingOut(false);
                        setAnimatingIn(false);
                      }, 250);
                    }}
                  />
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
}
