'use client';

import type { NotificationItem } from '@/contexts/notification-context';
import {
  BadgeCheck,
  Bell,
  CircleStar,
  Megaphone,
  MessageSquareWarning,
  Newspaper,
  Send,
  UserCheck,
  UserStar,
} from 'lucide-react';
import React from 'react';

export type NamedIcon = React.ComponentType<{ className?: string }>;

export function getNotificationIcons(item: Pick<NotificationItem, 'type'>): {
  Icon: NamedIcon;
  WmIcon: NamedIcon;
} {
  switch (item.type) {
    case 'AD_EVENT':
      return { Icon: CircleStar, WmIcon: Newspaper };
    case 'VERIFICATION_EVENT':
      return { Icon: BadgeCheck, WmIcon: UserCheck };
    case 'REPORT_EVENT':
      return { Icon: MessageSquareWarning, WmIcon: Send };
    case 'SYSTEM_ANNOUNCEMENT':
      return { Icon: Megaphone, WmIcon: UserStar };
    default:
      return { Icon: Bell, WmIcon: Bell };
  }
}
