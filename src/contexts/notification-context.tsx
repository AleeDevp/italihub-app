'use client';

import { useSession } from '@/lib/auth-client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

export type NotificationItem = {
  id: number;
  type: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  body: string;
  deepLink?: string | null;
  createdAt: string | Date;
  readAt?: string | Date | null;
  adId?: number | null;
  verificationId?: number | null;
  reportId?: number | null;
  data?: any;
};

type State = {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  hasMore: boolean;
  nextCursorId?: number | null;
};

type Action =
  | { type: 'LOAD_INIT' }
  | { type: 'LOAD_SUCCESS'; items: NotificationItem[]; nextCursorId?: number | null }
  | { type: 'ADD_NOTIFICATION'; item: NotificationItem }
  | { type: 'SET_CONNECTED'; value: boolean }
  | { type: 'MARK_AS_READ'; ids: number[] }
  | { type: 'LOAD_MORE_SUCCESS'; items: NotificationItem[]; nextCursorId?: number | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_INIT':
      return { ...state, isLoading: true };
    case 'LOAD_SUCCESS': {
      const unread = action.items.filter((n) => !n.readAt).length;
      return {
        ...state,
        notifications: action.items,
        unreadCount: unread,
        isLoading: false,
        hasMore: !!action.nextCursorId,
        nextCursorId: action.nextCursorId ?? null,
      };
    }
    case 'ADD_NOTIFICATION': {
      const exists = state.notifications.some((n) => n.id === action.item.id);
      const notifications = exists
        ? state.notifications
        : [action.item, ...state.notifications].slice(0, 100);
      return {
        ...state,
        notifications,
        unreadCount: state.unreadCount + (action.item.readAt ? 0 : 1),
      };
    }
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.value };
    case 'MARK_AS_READ': {
      const set = new Set(action.ids);
      const updated = state.notifications.map((n) =>
        set.has(n.id) ? { ...n, readAt: new Date() } : n
      );
      const unreadDelta = updated.filter((n) => !n.readAt).length;
      return { ...state, notifications: updated, unreadCount: unreadDelta };
    }
    case 'LOAD_MORE_SUCCESS': {
      const merged = [
        ...state.notifications,
        ...action.items.filter((i) => !state.notifications.find((n) => n.id === i.id)),
      ];
      return {
        ...state,
        notifications: merged,
        hasMore: !!action.nextCursorId,
        nextCursorId: action.nextCursorId ?? null,
      };
    }
    default:
      return state;
  }
}

type Ctx = State & {
  loadInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (ids: number[]) => Promise<void>;
};

const NotificationContext = createContext<Ctx | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

function useSSE(
  onEvent: (ev: MessageEvent) => void,
  onOpen: () => void,
  onError: () => void,
  enabled: boolean
) {
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    const es = new EventSource('/api/notifications/sse');
    es.addEventListener('notification', onEvent as any);
    es.addEventListener('ping', () => {});
    es.onopen = () => {
      retryRef.current = 0;
      onOpen();
    };
    es.onerror = () => {
      es.close();
      onError();
      const attempt = (retryRef.current = Math.min(retryRef.current + 1, 5));
      const backoff = [1000, 2000, 5000, 10000, 30000][attempt - 1] ?? 30000;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(connect, backoff) as any;
    };
    esRef.current = es;
  }, [onEvent, onOpen, onError, enabled]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      esRef.current?.close();
    };
  }, [connect, enabled]);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    isLoading: false,
    hasMore: false,
    nextCursorId: null,
  });
  const [enabled, setEnabled] = useState(false);
  const { data: session } = useSession();
  const isAuthed = !!session?.user?.id;
  const bootstrappedRef = useRef(false);

  const loadInitial = useCallback(async () => {
    dispatch({ type: 'LOAD_INIT' });
    const res = await fetch('/api/notifications?take=20');
    if (!res.ok) return;
    const json = await res.json();
    dispatch({
      type: 'LOAD_SUCCESS',
      items: json.items,
      nextCursorId: json.nextCursor?.cursorId ?? null,
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (!state.nextCursorId) return;
    const res = await fetch(`/api/notifications?take=20&cursorId=${state.nextCursorId}`);
    if (!res.ok) return;
    const json = await res.json();
    dispatch({
      type: 'LOAD_MORE_SUCCESS',
      items: json.items,
      nextCursorId: json.nextCursor?.cursorId ?? null,
    });
  }, [state.nextCursorId]);

  const markRead = useCallback(
    async (ids: number[]) => {
      if (ids.length === 0) return;
      // optimistic
      dispatch({ type: 'MARK_AS_READ', ids });
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        toast.error('Failed to sync read state');
        // Optional: refetch
        loadInitial();
      }
    },
    [loadInitial]
  );

  const onSseEvent = useCallback((ev: MessageEvent) => {
    try {
      const data = JSON.parse(ev.data);
      dispatch({ type: 'ADD_NOTIFICATION', item: data });
      // toast
      toast(data.title, {
        description: data.body,
        duration: 5000,
        action: data.deepLink
          ? {
              label: 'Open',
              onClick: () => {
                if (data.deepLink) window.location.href = data.deepLink;
              },
            }
          : undefined,
      });
    } catch {}
  }, []);

  const onOpen = useCallback(() => dispatch({ type: 'SET_CONNECTED', value: true }), []);
  const onError = useCallback(() => dispatch({ type: 'SET_CONNECTED', value: false }), []);

  // Enable only when a session exists; disable and clear when not
  useEffect(() => {
    if (isAuthed) {
      setEnabled(true);
      if (!bootstrappedRef.current) {
        bootstrappedRef.current = true;
        // loadInitial triggers its own LOAD_INIT
        void loadInitial();
      }
    } else {
      // on logout or unauthenticated
      setEnabled(false);
      bootstrappedRef.current = false;
      // ensure UI not stuck in loading
      dispatch({ type: 'LOAD_SUCCESS', items: [], nextCursorId: null });
    }
  }, [isAuthed, loadInitial]);

  useSSE(onSseEvent, onOpen, onError, enabled);

  const value = useMemo<Ctx>(
    () => ({ ...state, loadInitial, loadMore, markRead }),
    [state, loadInitial, loadMore, markRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
