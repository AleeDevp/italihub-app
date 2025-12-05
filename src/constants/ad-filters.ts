import type { AdStatus } from '@/generated/prisma';
import type { LucideIcon } from 'lucide-react';
import { Clock3, Hourglass, Wifi, XCircle } from 'lucide-react';

export type StatusTabConfig = {
  value: AdStatus;
  label: string;
  icon: LucideIcon;
  colorClasses: {
    active: string;
    inactive: string;
    badge: string;
  };
};

export type SortOption = 'newest' | 'oldest';

export type SortConfig = {
  value: SortOption;
  label: string;
  description: string;
};

export const STATUS_TABS: readonly StatusTabConfig[] = [
  {
    value: 'ONLINE',
    label: 'Online',
    icon: Wifi,
    colorClasses: {
      active:
        'data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:border-emerald-500',
      inactive: 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-700',
    },
  },
  {
    value: 'PENDING',
    label: 'Pending',
    icon: Clock3,
    colorClasses: {
      active:
        'data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:border-amber-500',
      inactive: 'text-amber-700 hover:bg-amber-50 hover:text-amber-900',
      badge: 'bg-amber-100 text-amber-700',
    },
  },
  {
    value: 'REJECTED',
    label: 'Rejected',
    icon: XCircle,
    colorClasses: {
      active:
        'data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:border-rose-500',
      inactive: 'text-rose-700 hover:bg-rose-50 hover:text-rose-900',
      badge: 'bg-rose-100 text-rose-700',
    },
  },
  {
    value: 'EXPIRED',
    label: 'Expired',
    icon: Hourglass,
    colorClasses: {
      active:
        'data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:border-slate-600',
      inactive: 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
      badge: 'bg-slate-100 text-slate-700',
    },
  },
] as const;

export const SORT_OPTIONS: readonly SortConfig[] = [
  { value: 'newest', label: 'Newest first', description: 'Recently created ads' },
  { value: 'oldest', label: 'Oldest first', description: 'Ads created earlier' },
] as const;

export const STATUS_ORDER: readonly AdStatus[] = [
  'ONLINE',
  'PENDING',
  'REJECTED',
  'EXPIRED',
] as const;
