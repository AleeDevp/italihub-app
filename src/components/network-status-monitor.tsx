// Example: Add this to your root layout or main layout to monitor connectivity app-wide

'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Offline Banner Component
 * Shows a permanent banner at the top when the user loses internet connection
 * Uses React Portal to render at the top level of the DOM, ensuring it appears above all other elements
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus({ showToasts: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (isOnline || !mounted) return null;

  return createPortal(
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 text-center shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
        <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-medium text-sm">You are offline</span>
      </div>
    </div>,
    document.body
  );
}
