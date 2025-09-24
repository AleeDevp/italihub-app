import { CompleteProfileSchema } from '@/lib/schemas/complete-profile-schema';
import { useCallback, useEffect, useRef, useState } from 'react';

type AvailabilityStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'taken'
  | 'invalid'
  | 'reserved'
  | 'error';

interface UseUserIdAvailabilityResult {
  status: AvailabilityStatus;
  message: string;
  check: (userId: string) => void;
}

interface AvailabilityCache {
  [key: string]: {
    available: boolean;
    reason?: 'invalid' | 'reserved' | 'taken';
    timestamp: number;
  };
}

const DEBOUNCE_DELAY = 500; // 500ms debounce
const CACHE_TTL = 30000; // 30 seconds cache

export function useUserIdAvailability(currentUserId?: string): UseUserIdAvailabilityResult {
  const [status, setStatus] = useState<AvailabilityStatus>('idle');
  const [message, setMessage] = useState('');

  // Cache for results (in-memory, session-scoped)
  const cacheRef = useRef<AvailabilityCache>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateStatus = useCallback((newStatus: AvailabilityStatus, newMessage: string) => {
    setStatus(newStatus);
    setMessage(newMessage);
  }, []);

  const checkAvailability = useCallback(
    async (userId: string, signal: AbortSignal) => {
      try {
        const params = new URLSearchParams({ userId });
        if (currentUserId) {
          params.append('currentUserId', currentUserId);
        }

        const response = await fetch(`/api/users/availability?${params}`, {
          signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (signal.aborted) return;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        // Cache the result
        cacheRef.current[userId.toLowerCase()] = {
          ...result,
          timestamp: Date.now(),
        };

        if (result.available) {
          updateStatus('available', 'Great! This userId is available');
        } else {
          switch (result.reason) {
            case 'invalid':
              updateStatus(
                'invalid',
                'Invalid format. Use 4-15 characters, start with a letter, only letters, numbers and underscore.'
              );
              break;
            case 'reserved':
              updateStatus('reserved', 'This userId is reserved and cannot be used.');
              break;
            case 'taken':
              updateStatus('taken', 'This userId is already taken.');
              break;
            default:
              updateStatus('taken', 'This userId is not available.');
          }
        }
      } catch (error) {
        if (signal.aborted) return;
        console.error('UserId availability check failed:', error);
        updateStatus('error', 'Unable to check availability. Please try again.');
      }
    },
    [currentUserId, updateStatus]
  );

  const check = useCallback(
    (userId: string) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Reset to idle if empty
      if (!userId.trim()) {
        updateStatus('idle', '');
        return;
      }

      const normalizedUserId = userId.trim().toLowerCase();

      // If it's the same as current user's ID, mark as available immediately
      if (currentUserId && normalizedUserId === currentUserId.toLowerCase()) {
        updateStatus('available', 'This is your current userId');
        return;
      }

      // Check basic format first using CompleteProfileSchema (client-side validation)
      const userIdSchema = CompleteProfileSchema.shape.userId;
      const formatResult = userIdSchema.safeParse(userId);

      if (!formatResult.success) {
        const errorMessage = formatResult.error.issues[0]?.message || 'Invalid format';
        updateStatus('invalid', errorMessage);
        return;
      }

      // Check cache first
      const cached = cacheRef.current[normalizedUserId];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (cached.available) {
          updateStatus('available', 'Great! This userId is available');
        } else {
          switch (cached.reason) {
            case 'reserved':
              updateStatus('reserved', 'This userId is reserved and cannot be used.');
              break;
            case 'taken':
              updateStatus('taken', 'This userId is already taken.');
              break;
            default:
              updateStatus('taken', 'This userId is not available.');
          }
        }
        return;
      }

      // Set up debounced check
      updateStatus('checking', 'Checking availability...');

      timeoutRef.current = setTimeout(() => {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        checkAvailability(userId, abortController.signal);
      }, DEBOUNCE_DELAY);
    },
    [currentUserId, updateStatus, checkAvailability]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    status,
    message,
    check,
  };
}
