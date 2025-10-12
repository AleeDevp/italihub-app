// Example: Add this to your root layout or main layout to monitor connectivity app-wide

'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

/**
 * Offline Banner Component
 * Shows a permanent banner at the top when the user loses internet connection
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus({ showToasts: false });

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-2 px-4 text-center shadow-md">
      <span className="font-medium">⚠️ You are offline</span>
      <span className="ml-2 text-sm">Please check your internet connection</span>
    </div>
  );
}
