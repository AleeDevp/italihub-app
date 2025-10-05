'use client';

import type { NotificationItem } from '@/contexts/notification-context';
import { formatDistanceToNow } from 'date-fns';
import { Bell, ChevronRight, Flag, Megaphone, ShieldCheck, Tag } from 'lucide-react';
import React from 'react';

type CommonProps = {
  item: NotificationItem;
  onNavigate?: () => void;
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function WatermarkIcon({
  children,
  colorClass,
}: {
  children: React.ReactNode;
  colorClass: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
      <div className={cn('absolute -right-2 -top-2 opacity-[0.07]', colorClass)}>{children}</div>
    </div>
  );
}

function BaseItem({
  item,
  onClick,
  bg,
  watermark,
  metaLabel,
  rightAdornment,
  metaIcon,
}: {
  item: NotificationItem;
  onClick?: () => void;
  bg?: string; // background color classes
  watermark?: React.ReactNode; // faint background icon
  metaLabel?: string;
  rightAdornment?: React.ReactNode;
  metaIcon?: React.ReactNode;
}) {
  const isUnread = !item.readAt;
  const readAtDate = item.readAt ? new Date(item.readAt) : null;
  const withinOneHour = readAtDate ? Date.now() - readAtDate.getTime() < 60 * 60 * 1000 : false;
  const isVibrant = isUnread || withinOneHour;
  return (
    <li
      className={cn(
        'relative p-3 pb-6 transition-colors rounded-md cursor-pointer shadow-xs ',
        'hover:bg-accent/60',
        isVibrant ? 'bg-accent/40 border-border/60' : 'border-transparent',
        bg
      )}
      onClick={onClick}
    >
      {watermark && <div className={cn(!isVibrant && 'opacity-50')}>{watermark}</div>}
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'mt-1 h-2.5 w-2.5 rounded-full shrink-0',
            isUnread ? 'bg-blue-500' : 'bg-muted-foreground/30'
          )}
        />
        <div className="flex-1 min-w-0">
          {/* Meta row: label left */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">
              {metaIcon}
              {metaLabel}
            </span>
          </div>
          {/* Title */}
          <p
            className={cn(
              'text-sm truncate',
              isVibrant ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
            )}
          >
            {item.title}
          </p>
          <p
            className={cn(
              'text-sm line-clamp-2 ',
              isVibrant ? 'text-muted-foreground' : 'text-muted-foreground/70'
            )}
          >
            {item.body}
          </p>
        </div>
        {rightAdornment && (
          <div className="pl-2 pr-1 self-stretch flex flex-col items-end justify-center">
            {rightAdornment}
          </div>
        )}
      </div>
      {/* Absolute bottom-right date */}
      <span className="absolute bottom-2 right-3 text-[9.6px] text-neutral-400 whitespace-nowrap">
        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
      </span>
    </li>
  );
}

// AD_EVENT variants: ONLINE (success), REJECTED (error), EXPIRED (warning) — PENDING ignored
export function AdNotificationItem({ item, onNavigate }: CommonProps) {
  const status: string | undefined = item?.data?.adStatus || item?.data?.status;
  const navigate = () => {
    if (onNavigate) onNavigate();
    window.location.href = '/dashboard/ads';
  };

  if (status === 'PENDING') return null;

  let bg = 'bg-green-50/30';
  let wmColor = 'text-green-600';
  if (status === 'REJECTED') {
    bg = 'bg-red-50/30';
    wmColor = 'text-red-600';
  } else if (status === 'EXPIRED') {
    bg = 'bg-amber-50/30';
    wmColor = 'text-amber-600';
  } else if (status === 'ONLINE') {
    bg = 'bg-emerald-50/30';
    wmColor = 'text-emerald-600';
  } else {
    // fallback
    bg = 'bg-sky-50/30';
    wmColor = 'text-sky-600';
  }

  return (
    <BaseItem
      item={item}
      onClick={navigate}
      bg={bg}
      metaLabel="Ad notification"
      metaIcon={<Tag className="h-3.5 w-3.5 text-muted-foreground" />}
      rightAdornment={<ChevronRight className="h-5 w-5 text-muted-foreground" />}
      watermark={
        <WatermarkIcon colorClass={wmColor}>
          <Tag className="h-20 w-20" />
        </WatermarkIcon>
      }
    />
  );
}

// VERIFICATION_EVENT variants: APPROVED (success), REJECTED (error) — PENDING ignored
export function VerificationNotificationItem({ item, onNavigate }: CommonProps) {
  const status: string | undefined = item?.data?.status;
  // derive from severity if status missing
  const derived =
    !status && item.severity === 'SUCCESS'
      ? 'APPROVED'
      : item.severity === 'ERROR'
        ? 'REJECTED'
        : status;
  const navigate = () => {
    if (onNavigate) onNavigate();
    window.location.href = '/dashboard/verification';
  };

  if (derived === 'PENDING') return null;

  let bg = 'bg-green-50/30';
  let wmColor = 'text-green-600';
  if (derived === 'REJECTED') {
    bg = 'bg-rose-50/30';
    wmColor = 'text-rose-600';
  } else if (derived === 'APPROVED') {
    bg = 'bg-emerald-50/30';
    wmColor = 'text-emerald-600';
  }

  return (
    <BaseItem
      item={item}
      onClick={navigate}
      bg={bg}
      metaLabel="Verification notification"
      metaIcon={<ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />}
      rightAdornment={<ChevronRight className="h-5 w-5 text-muted-foreground" />}
      watermark={
        <WatermarkIcon colorClass={wmColor}>
          <ShieldCheck className="h-20 w-20" />
        </WatermarkIcon>
      }
    />
  );
}

// REPORT_EVENT: info look across all subtypes
export function ReportNotificationItem({ item, onNavigate }: CommonProps) {
  const navigate = () => {
    // No specific redirect requested; follow deepLink if provided
    if (onNavigate) onNavigate();
    if (item.deepLink) window.location.href = item.deepLink;
  };

  return (
    <BaseItem
      item={item}
      onClick={item.deepLink ? navigate : undefined}
      bg="bg-sky-50/30"
      metaLabel="Report notification"
      metaIcon={<Flag className="h-3.5 w-3.5 text-muted-foreground" />}
      watermark={
        <WatermarkIcon colorClass="text-sky-600">
          <Flag className="h-20 w-20" />
        </WatermarkIcon>
      }
    />
  );
}

// SYSTEM_ANNOUNCEMENT: unique announcement UI
export function SystemAnnouncementNotificationItem({ item, onNavigate }: CommonProps) {
  const navigate = () => {
    if (onNavigate) onNavigate();
    if (item.deepLink) window.location.href = item.deepLink;
  };

  return (
    <BaseItem
      item={item}
      onClick={item.deepLink ? navigate : undefined}
      bg="bg-purple-50/30"
      metaLabel="Announcement notification"
      metaIcon={<Megaphone className="h-3.5 w-3.5 text-muted-foreground" />}
      watermark={
        <WatermarkIcon colorClass="text-purple-600">
          <Megaphone className="h-20 w-20" />
        </WatermarkIcon>
      }
    />
  );
}

export function GenericNotificationItem({ item, onNavigate }: CommonProps) {
  const navigate = () => {
    if (onNavigate) onNavigate();
    if (item.deepLink) window.location.href = item.deepLink;
  };
  return (
    <BaseItem
      item={item}
      onClick={item.deepLink ? navigate : undefined}
      metaLabel="Notification"
      metaIcon={<Bell className="h-3.5 w-3.5 text-muted-foreground" />}
    />
  );
}

export function NotificationListItem({ item, onNavigate }: CommonProps) {
  switch (item.type) {
    case 'AD_EVENT':
      return <AdNotificationItem item={item} onNavigate={onNavigate} />;
    case 'VERIFICATION_EVENT':
      return <VerificationNotificationItem item={item} onNavigate={onNavigate} />;
    case 'REPORT_EVENT':
      return <ReportNotificationItem item={item} onNavigate={onNavigate} />;
    case 'SYSTEM_ANNOUNCEMENT':
      return <SystemAnnouncementNotificationItem item={item} onNavigate={onNavigate} />;
    default:
      return <GenericNotificationItem item={item} onNavigate={onNavigate} />;
  }
}
