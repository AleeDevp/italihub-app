# Notifications System — Architecture, API, and Usage Guide

This document describes the complete, production-ready notifications system implemented in this repository: real-time delivery over SSE, authenticated endpoints, a client provider with resilient state, and a polished UI with a bell popover and type-specific items.

It covers architecture, data model, server endpoints and services, client provider/hooks, UI components, read-state logic, session gating, moderation integration, and guidance on extending and testing.

---

## Goals and design principles

- Real-time, low-latency delivery (SSE/EventSource)
- Auth-first: never fetch or connect without a session
- Simple mental model: centralized NotificationProvider + hook
- Reliable UX: optimistic read state, retries where needed
- Clear visuals per notification type and status
- Minimal coupling: clean service layer; reusable UI variants

---

## High-level architecture

- Transport: Server-Sent Events (SSE) via `EventSource`
- Persistence: Prisma `Notification` model
- Server: REST APIs for list, mark-read, count; SSE stream
- Client state: React Context + useReducer in `NotificationProvider`
- UI: Shadcn Popover bell dropdown; per-type item variants; toasts

Flow

1. Backend creates a notification → persists in DB → publishes to user SSE stream
2. Client receives SSE event → adds to state → shows toast
3. User views dropdown → visible items are marked read on close (optimistic)

---

## Data model (Prisma)

See: `docs/notification system/db_notification.md`

Key points

- Unread = `readAt IS NULL`
- Optional `deepLink` for navigation
- `data` JSON carries type-specific payloads (e.g., status)
- Composite index for fast unread counting and recent-sort queries

---

## Server-side components

### Auth helpers

- `src/lib/require-user.ts`: `requireUser()` throws 401 if no session; `getCurrentUser()` returns user or null.
- `src/lib/get-session.ts` and `src/lib/auth.ts`: Better Auth setup.

### Notification service

- File: `src/lib/services/notification-service.ts`
  - `createNotification(input)`: persists and publishes SSE to the target user.
  - `serializeNotification(n)`: normalizes payload for SSE/client.
  - `getUnreadCount(userId)`: count unread rows.
  - `markNotificationsAsRead(userId, ids)`: bulk update with audit logging.

### SSE broker

- File: `src/lib/sse/notification-broker.ts`
  - In-memory connection registry: multiple connections per user.
  - `publish(userId, event, payload)`: send to all tabs for the user.
  - Heartbeats sent from route to keep connections alive.

### API routes

- List: `src/app/api/notifications/route.ts`
  - GET: paginated notifications for current user (cursor-based via id)
- SSE: `src/app/api/notifications/sse/route.ts`
  - GET: requires auth, opens SSE stream; sends initial `ping`, then pings every 30s
- Mark read: `src/app/api/notifications/mark-read/route.ts`
  - POST: `{ ids: number[] }` → sets `readAt` for current user
- Count: `src/app/api/notifications/count/route.ts`
  - GET: returns `{ count }` for current user

All routes call `requireUser()` and are safe against anonymous access.

---

## Client-side state and hooks

### NotificationProvider

- File: `src/contexts/notification-context.tsx`
- State shape
  - `notifications: NotificationItem[]`
  - `unreadCount: number`
  - `isConnected: boolean`
  - `isLoading: boolean`
  - `hasMore: boolean`
  - `nextCursorId: number | null`
- Public API
  - `loadInitial()` – fetch first page
  - `loadMore()` – pagination using `nextCursorId`
  - `markRead(ids: number[])` – optimistic read-update + POST sync
- SSE lifecycle
  - Connects to `/api/notifications/sse` only when session exists
  - Reconnects on error with backoff; `SET_CONNECTED` toggles state
- Session gating
  - Uses `useSession()` from Better Auth client: when no session → no network calls, provider remains idle; on login → `loadInitial()` and enable SSE
- Toasts on new events (via `sonner`)

Use in app root

- Wrapped in `src/app/layout.tsx` around the page tree

Consume with hook

- `const { notifications, unreadCount, loadMore, markRead } = useNotifications()`

---

## UI components

### Bell popover

- File: `src/components/notifications/notification-bell.tsx`
- Uses Shadcn `Popover`
- Shows unread badge (caps at `99+`)
- On popover close: marks visible notifications as read (first 15)
- Renders the dropdown inside `PopoverContent`

### Dropdown

- File: `src/components/notifications/notification-dropdown.tsx`
- Shows loader states and empty state
- Renders top 15 notifications with a "Load more" button for pagination
- Explicit Close button marks visible items as read, then closes
- Prevents outside-clicks from prematurely closing during internal interactions
- Initial load is managed by the provider (dropdown does not auto-fetch)

### Type-specific item variants

- File: `src/components/notifications/notification-variants.tsx`
- Shared `BaseItem` with vibrancy logic
  - Unread or read within last hour → vibrant styling
  - Older read → muted
- Variants
  - `AdNotificationItem` – status-aware backgrounds/icons; navigates to `/dashboard/ads`
  - `VerificationNotificationItem` – APPROVED/REJECTED; navigates to `/dashboard/verification`
  - `ReportNotificationItem` – optional deepLink
  - `SystemAnnouncementNotificationItem` – optional deepLink
  - `GenericNotificationItem` – fallback
- UI polish
  - Meta label row with a small icon (top-left)
  - Chevron on the right for clickable items
  - Absolute timestamp bottom-right (`formatDistanceToNow`)
  - Watermark icon with faint opacity

---

## Read-state and UX rules

- Mark-as-read happens only on explicit close actions:
  - Closing the popover
  - Clicking the Close button in the dropdown
  - Clicking the bell again while open (captured to mark before close)
- Only the first page (top 15) are marked read automatically on close
- Optimistic update: UI flips to read instantly; API sync follows; on failure a toast appears and an initial reload is triggered as fallback

---

## Post-login behavior and session gating

- The provider no longer probes `/api/notifications/count` unauthenticated
- It listens to the Better Auth `useSession()` client state:
  - When a session exists → enable SSE and call `loadInitial()` exactly once
  - When session disappears (logout) → disable SSE and clear loading state (no network calls)

This prevents 401s/500s from unauthenticated calls and ensures a smooth first open after login.

---

## Moderator integration and event creation

Creation points

- Moderation flows create notifications on verification decisions
  - Rejection reason is humanized and presented in the body (note text omitted)
- Ads: status changes (ONLINE, REJECTED, EXPIRED; PENDING ignored for UI)
- Reports: resolution info (optional deepLink)
- System: admin-triggered messages

Server APIs used

- `src/app/api/moderator/notifications/route.ts` – a test/submit endpoint for sending notifications (useful for QA across devices)
- Internally, all creation uses `createNotification()` which also publishes to SSE

Client UX

- New events trigger a toast with title/body and an optional Open action (deepLink)

---

## How to use it in your code

1. Ensure provider is wrapped around the app (already done in `src/app/layout.tsx`).

2. Render the bell anywhere (e.g., header)

- `src/components/header.tsx` shows `<NotificationBell />` inside the right-side controls when a session exists.

3. Use the hook where needed

- `const { notifications, unreadCount, loadMore, markRead } = useNotifications()`
- Examples
  - Show unread badge count in a custom UI
  - Build a full notifications page with filters and infinite scroll (reuse `loadMore`)

4. Create notifications on the server

- Call `createNotification({ userId, type, severity, title, body, deepLink, data })`
- For moderation actions, call after changing the domain state (e.g., verification approved/rejected)

5. Add a new notification type

- Data layer: ensure `NotificationType` enum has your new type
- UI layer: add a new variant in `notification-variants.tsx`, then switch on it in `NotificationListItem`
- Creation: use `createNotification()` with `type: 'YOUR_NEW_TYPE'` and any `data` needed by your variant

---

## Operational considerations

- SSE scaling
  - Current broker is in-memory; for multi-instance deployments, move to Redis pub/sub or a shared event bus and fan-out per user
  - Consider sticky sessions or a shared broker layer if using edge/load-balanced setups
- Heartbeats
  - Server sends `ping` every 30s; clients reconnect with backoff on errors
- Rate limiting
  - Add simple rate limiting for `mark-read` and `list` endpoints if needed
- Cross-tab sync
  - Optionally broadcast read-state using `BroadcastChannel`

---

## Testing and troubleshooting

- Local QA
  - Use the moderator test sender: `POST /api/moderator/notifications` to push a sample notification to your user
  - Open two tabs under the same user; confirm both receive SSE events
  - Log out and ensure no `/api/notifications*` requests occur until you log in again
- Common issues
  - 401/500 noise while logged out → fixed by session-gated provider (no client calls without a session)
  - Dropdown closes on internal clicks → handled; outside-clicks are filtered; load-more won’t close the popover
  - Read-state marking too aggressive → currently restricted to the first page (top 15)

---

## Future enhancements

- Full notifications page with filters and infinite scrolling
- Persisted user preferences (e.g., toast sounds, per-type muting)
- Redis-based SSE hub for horizontal scaling
- Skeleton loaders and micro-animations in the dropdown

---

## File map (quick reference)

- Server
  - `src/app/api/notifications/route.ts` — list notifications (auth required)
  - `src/app/api/notifications/sse/route.ts` — SSE stream (auth required)
  - `src/app/api/notifications/mark-read/route.ts` — bulk mark read (auth required)
  - `src/app/api/notifications/count/route.ts` — unread count (auth required)
  - `src/lib/services/notification-service.ts` — create/serialize/count/mark services and SSE publish
  - `src/lib/sse/notification-broker.ts` — in-memory SSE broker
  - `src/lib/require-user.ts` — auth utilities used by routes

- Client
  - `src/contexts/notification-context.tsx` — provider, reducer, SSE hookup, session gating
  - `src/components/notifications/notification-bell.tsx` — popover bell with unread badge
  - `src/components/notifications/notification-dropdown.tsx` — dropdown list and controls
  - `src/components/notifications/notification-variants.tsx` — UI variants per type

- Docs
  - `docs/notification system/db_notification.md` — Prisma model details
  - `docs/notification system/notification_system_implementation_guide.md` — earlier high-level guide
  - `docs/notification system/README.md` — this comprehensive guide

---

## Appendix — contracts and error modes

- SSE contract
  - Event: `notification` — payload from `serializeNotification`
  - Event: `ping` — `{ t: number }`
- Client actions
  - `LOAD_INIT`, `LOAD_SUCCESS`, `ADD_NOTIFICATION`, `SET_CONNECTED`, `MARK_AS_READ`, `LOAD_MORE_SUCCESS`
- Errors
  - Network failures on mark-read → toast error and initial reload as fallback
  - SSE disconnects → backoff reconnect; `isConnected` reflects transport state
