'use client';

import type { NotificationItem } from '@/contexts/notification-context';
import { X } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { getNotificationIcons } from './notification-icons';
import { getNotificationTheme } from './notification-theme';

type Theme = {
  bg: string;
  dot: string;
  iconColor: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>; // small icon
  WmIcon: React.ComponentType<{ className?: string }>; // watermark icon
  wmColor: string; // watermark icon color
  labelPillBg: string;
  labelPillText: string;
};

function cn(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(' ');
}

function deriveStatusForAd(item: NotificationItem): string | undefined {
  return (item as any)?.data?.adStatus || (item as any)?.data?.status;
}

function deriveStatusForVerification(item: NotificationItem): string | undefined {
  const status: string | undefined = (item as any)?.data?.status;
  if (!status) {
    if (item.severity === 'SUCCESS') return 'APPROVED';
    if (item.severity === 'ERROR') return 'REJECTED';
  }
  return status;
}

function getTheme(item: NotificationItem): Theme {
  const shared = getNotificationTheme(item);
  const icons = getNotificationIcons(item);
  return {
    bg: shared.bgToast,
    dot: shared.dot,
    iconColor: shared.iconColor,
    label: shared.label,
    labelPillBg: shared.labelPillBg,
    labelPillText: shared.labelPillText,
    wmColor: shared.wmColor,
    ...icons,
  };
}

function NotificationToastUI({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: () => void;
}) {
  const theme = getTheme(item);
  const { Icon, WmIcon } = theme;

  // We intentionally do not render actions in the toast to reduce clutter.

  return (
    <div
      className={cn(
        'relative w-[380px] max-w-[92vw] rounded-lg shadow-lg overflow-hidden',
        'pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200',
        theme.bg
      )}
      role="status"
      aria-live="polite"
    >
      {/* Watermark icon */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn('absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.08]', theme.wmColor)}
        >
          <WmIcon className="h-24 w-24" />
        </div>
      </div>
      <div className="flex items-stretch">
        {/* Accent bar */}
        <div className={cn('w-1.5', theme.dot)} />
        <div className="flex-1 p-3 pr-2">
          <div className="flex items-start gap-2">
            <div className={cn('mt-0.5', theme.iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                    theme.labelPillBg,
                    theme.labelPillText
                  )}
                >
                  {theme.label}
                </span>
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground truncate">
                {item.title}
              </div>
              {item.body && (
                <div className="mt-0.5 text-xs text-muted-foreground line-clamp-3">{item.body}</div>
              )}
              <div className="mt-2" />
            </div>
            <button
              aria-label="Dismiss"
              onClick={onDismiss}
              className="ml-1 mt-0.5 rounded p-1 text-muted-foreground/70 hover:text-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function showNotificationToast(item: NotificationItem) {
  return toast.custom(
    (t) => <NotificationToastUI item={item} onDismiss={() => toast.dismiss(t)} />,
    {
      duration: 5000,
    }
  );
}
