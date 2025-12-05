import type { AdStatus } from '@/generated/prisma';

/**
 * Get status badge color classes
 */
export function getStatusColor(status: AdStatus): string {
  const colorMap: Record<AdStatus, string> = {
    ONLINE: 'bg-green-50 text-green-700 border-green-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    EXPIRED: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return colorMap[status];
}

/**
 * Get status dot color
 */
export function getStatusDotColor(status: AdStatus): string {
  const colorMap: Record<AdStatus, string> = {
    ONLINE: 'bg-green-500',
    PENDING: 'bg-amber-500',
    REJECTED: 'bg-rose-500',
    EXPIRED: 'bg-gray-400',
  };
  return colorMap[status];
}

/**
 * Format status label for display
 */
export function formatStatusLabel(status: AdStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/**
 * Get expiration color based on days left
 */
export function getExpirationColor(daysLeft: number): string {
  if (daysLeft === 0) return 'border-rose-200 text-rose-700';
  if (daysLeft <= 3) return 'border-amber-200 text-amber-700';
  return 'border-emerald-200 text-emerald-700';
}

/**
 * Format days left label
 */
export function formatDaysLeftLabel(daysLeft: number): string {
  if (daysLeft === 0) return 'today';
  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
}

/**
 * Calculate expiration details from date
 */
export function getExpirationDetails(expirationDate: Date | string | null) {
  if (!expirationDate) return null;

  const expiry = new Date(expirationDate);
  const now = new Date();
  const daysLeft = Math.max(
    Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    0
  );

  return { daysLeft };
}
