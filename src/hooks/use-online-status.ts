'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to monitor online/offline status
 * Returns boolean indicating if the user is currently online
 */
export function useOnlineStatus(options?: { showToasts?: boolean }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize with current status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
