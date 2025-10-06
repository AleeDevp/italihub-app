'use client';

import type { NotificationItem } from '@/contexts/notification-context';

export type NotificationSharedTheme = {
  // Toast
  bgToast: string;
  dot: string;
  iconColor: string;
  label: string; // short label for toast pill
  labelPillBg: string;
  labelPillText: string;

  // Dropdown
  metaLabel: string; // label for dropdown list items
  bgVibrant: string;
  bgMuted: string;

  // Shared
  wmColor: string; // watermark color
};

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

export function getNotificationTheme(item: NotificationItem): NotificationSharedTheme {
  const base: NotificationSharedTheme = {
    // Toast neutrals
    bgToast: 'bg-background',
    dot: 'bg-slate-400',
    iconColor: 'text-slate-600',
    label: 'Notification',
    labelPillBg: 'bg-slate-100/70',
    labelPillText: 'text-slate-700',
    // Dropdown neutrals
    metaLabel: 'Notification',
    bgVibrant: 'bg-muted/60',
    bgMuted: 'bg-muted/30',
    // Shared
    wmColor: 'text-slate-600',
  };

  switch (item.type) {
    case 'AD_EVENT': {
      const st = deriveStatusForAd(item);
      if (st === 'REJECTED')
        return {
          ...base,
          bgToast: 'bg-red-50',
          dot: 'bg-red-500',
          iconColor: 'text-red-600',
          label: 'Ad update',
          labelPillBg: 'bg-red-100/70',
          labelPillText: 'text-red-700',
          metaLabel: 'Ad notification',
          bgVibrant: 'bg-red-50/60',
          bgMuted: 'bg-red-50/25',
          wmColor: 'text-red-600',
        };
      if (st === 'EXPIRED')
        return {
          ...base,
          bgToast: 'bg-amber-50',
          dot: 'bg-amber-500',
          iconColor: 'text-amber-600',
          label: 'Ad update',
          labelPillBg: 'bg-amber-100/70',
          labelPillText: 'text-amber-700',
          metaLabel: 'Ad notification',
          bgVibrant: 'bg-amber-50/60',
          bgMuted: 'bg-amber-50/25',
          wmColor: 'text-amber-600',
        };
      // ONLINE / SUCCESS
      if (st === 'ONLINE' || item.severity === 'SUCCESS') {
        return {
          ...base,
          bgToast: 'bg-pink-50',
          dot: 'bg-pink-500',
          iconColor: 'text-pink-700',
          label: 'Ad update',
          labelPillBg: 'bg-pink-100/70',
          labelPillText: 'text-pink-700',
          metaLabel: 'Ad notification',
          bgVibrant: 'bg-pink-50/60',
          bgMuted: 'bg-pink-50/25',
          wmColor: 'text-pink-600',
        };
      }
      // fallback align with pink
      return {
        ...base,
        bgToast: 'bg-pink-50',
        dot: 'bg-pink-500',
        iconColor: 'text-pink-700',
        label: 'Ad update',
        labelPillBg: 'bg-pink-100/70',
        labelPillText: 'text-pink-700',
        metaLabel: 'Ad notification',
        bgVibrant: 'bg-pink-50/60',
        bgMuted: 'bg-pink-50/25',
        wmColor: 'text-pink-600',
      };
    }
    case 'VERIFICATION_EVENT': {
      const st = deriveStatusForVerification(item);
      if (st === 'REJECTED')
        return {
          ...base,
          bgToast: 'bg-rose-50',
          dot: 'bg-rose-500',
          iconColor: 'text-rose-600',
          label: 'Verification',
          labelPillBg: 'bg-rose-100/70',
          labelPillText: 'text-rose-700',
          metaLabel: 'Verification notification',
          bgVibrant: 'bg-rose-50/60',
          bgMuted: 'bg-rose-50/25',
          wmColor: 'text-rose-600',
        };
      // APPROVED or default
      return {
        ...base,
        bgToast: 'bg-emerald-50',
        dot: 'bg-emerald-500',
        iconColor: 'text-emerald-600',
        label: 'Verification',
        labelPillBg: 'bg-emerald-100/70',
        labelPillText: 'text-emerald-700',
        metaLabel: 'Verification notification',
        bgVibrant: 'bg-emerald-50/60',
        bgMuted: 'bg-emerald-50/25',
        wmColor: 'text-emerald-600',
      };
    }
    case 'REPORT_EVENT':
      return {
        ...base,
        bgToast: 'bg-sky-50',
        dot: 'bg-sky-500',
        iconColor: 'text-sky-700',
        label: 'Report',
        labelPillBg: 'bg-sky-100/70',
        labelPillText: 'text-sky-700',
        metaLabel: 'Report notification',
        bgVibrant: 'bg-sky-50/60',
        bgMuted: 'bg-sky-50/25',
        wmColor: 'text-sky-600',
      };
    case 'SYSTEM_ANNOUNCEMENT':
      return {
        ...base,
        bgToast: 'bg-purple-50',
        dot: 'bg-purple-500',
        iconColor: 'text-purple-700',
        label: 'Announcement',
        labelPillBg: 'bg-purple-100/70',
        labelPillText: 'text-purple-700',
        metaLabel: 'Announcement notification',
        bgVibrant: 'bg-purple-50/60',
        bgMuted: 'bg-purple-50/25',
        wmColor: 'text-purple-600',
      };
    default:
      return base;
  }
}
