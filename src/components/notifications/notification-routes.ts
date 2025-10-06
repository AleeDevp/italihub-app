'use client';

import type { NotificationItem } from '@/contexts/notification-context';

// Returns the default route for a notification type. Deep links should take precedence at call sites.
export function getNotificationHref(item: Pick<NotificationItem, 'type'>): string | undefined {
  switch (item.type) {
    case 'AD_EVENT':
      return '/dashboard/ads';
    case 'VERIFICATION_EVENT':
      return '/dashboard/verification';
    case 'REPORT_EVENT':
    case 'SYSTEM_ANNOUNCEMENT':
    default:
      return undefined;
  }
}

// Centralized navigation for notifications: calls onNavigate first, then navigates to deepLink or fallback href.
export function navigateForNotification(
  item: Pick<NotificationItem, 'type' | 'deepLink'>,
  onNavigate?: () => void
) {
  try {
    if (onNavigate) onNavigate();
  } catch {
    // ignore onNavigate errors to avoid blocking navigation
  }
  const href = item.deepLink ?? getNotificationHref(item);
  if (href) window.location.href = href;
}
