# Comprehensive SSE-Based Real-Time Notification System for Next.js

Based on your schema and requirements, here's a tailored implementation guide:

## Architecture Overview

**Tech Stack:**

- **Real-Time:** Server-Sent Events (SSE)
- **State Management:** React Context + useReducer
- **Database:** Prisma (already defined)
- **Toast Notifications:** React-hot-toast or Sonner (recommended)
- **Fetch/Caching:** Native fetch with React state (or SWR/React Query)

---

## Phase 1: Backend API Structure

### API Routes Architecture

```
/api/notifications/
  ├── route.ts
  │   └── GET: Fetch paginated notifications for current user
  │
  ├── sse/route.ts
  │   └── GET: SSE endpoint - long-lived connection for real-time events
  │
  ├── mark-read/route.ts
  │   └── POST: Bulk mark notifications as read (called on dropdown/page close)
  │
  └── count/route.ts (optional)
      └── GET: Quick unread count endpoint for navbar badge
```

### Database Query Patterns

**1. Fetch User Notifications (Paginated):**

- Query: `WHERE userId = X ORDER BY createdAt DESC`
- Use cursor-based pagination (last `createdAt` + `id`)
- Return 20-30 notifications per page
- Include related data (ad, verification, report) if needed
- Mark which ones are unread (`readAt IS NULL`)

**2. Get Unread Count:**

- Query: `COUNT(*) WHERE userId = X AND readAt IS NULL`
- Fast query due to your composite index
- Used for badge number

**3. Bulk Mark as Read:**

- Update: `SET readAt = NOW() WHERE userId = X AND readAt IS NULL AND id IN [...]`
- Accept array of notification IDs
- Only update unread notifications to avoid unnecessary writes
- Return count of updated records

**4. Create Notification (Internal Service):**

- Insert new notification record
- Immediately publish to SSE stream for that userId
- This happens when moderator approves/rejects ad or verification

---

## Phase 2: SSE Implementation Details

### Server-Side SSE Connection Management

**Connection Flow:**

1. **Client Opens Connection:** `GET /api/notifications/sse`
2. **Authentication Check:** Verify user session/JWT, reject if unauthorized
3. **Keep Connection Open:** Set headers for SSE, don't close response
4. **Store Connection:** Map userId → response stream in memory (or Redis for multi-server)
5. **Send Heartbeat:** Ping every 30-45 seconds to keep connection alive
6. **Handle Disconnect:** Remove from connection map when client disconnects

**In-Memory Connection Store:**

```
Structure: Map<userId, Response>
- When notification created → look up userId → send SSE event
- When connection closes → remove from map
- Handle multiple tabs: same user can have multiple connections
```

**SSE Message Format:**

```
Event types:
- "notification" → new notification arrived
- "ping" → heartbeat to keep connection alive
- "reconnect" → tell client to reconnect if server restarting

Data payload (JSON):
{
  id: number,
  type: NotificationType,
  severity: NotificationSeverity,
  title: string,
  body: string,
  deepLink: string | null,
  createdAt: string,
  // Include related entity data if needed
}
```

### Client-Side SSE Connection

**Connection Lifecycle:**

1. **Initialize on Login:** Open SSE connection when user authenticated
2. **Reconnection Logic:**
   - If connection drops, wait 1s, then 2s, then 5s, then 10s (exponential backoff)
   - Max 5 retry attempts
   - Reset retry count on successful connection
3. **Close on Logout:** Explicitly close connection and cleanup
4. **Handle Errors:** Show user "offline" status if can't reconnect

**Event Handling:**

- Listen for "notification" events
- Parse JSON payload
- Add to notification state (prepend to array)
- Increment unread count
- Show toast notification with title + body
- Play subtle sound (optional, with user preference toggle)

---

## Phase 3: Frontend Component Architecture

### 1. NotificationProvider (Context)

**Responsibilities:**

- Maintain global notification state
- Manage SSE connection lifecycle
- Provide notifications array and unread count to entire app
- Handle adding new notifications from SSE
- Handle bulk mark-as-read operations
- Initial load of notifications on mount

**State Structure:**

```
{
  notifications: Notification[],
  unreadCount: number,
  isConnected: boolean,
  isLoading: boolean,
  hasMore: boolean, // for pagination
}
```

**Actions:**

- `LOAD_NOTIFICATIONS` - initial fetch
- `ADD_NOTIFICATION` - from SSE
- `MARK_AS_READ` - bulk update
- `LOAD_MORE` - pagination
- `SET_CONNECTED` - connection status

### 2. useNotificationSSE Hook

**Responsibilities:**

- Create and manage SSE EventSource
- Handle reconnection with exponential backoff
- Listen for events and dispatch to context
- Cleanup on unmount
- Expose connection status

**Logic Flow:**

1. Create EventSource pointing to `/api/notifications/sse`
2. Attach event listeners (onmessage, onerror, onopen)
3. On "notification" event → dispatch ADD_NOTIFICATION
4. On "ping" event → update last heartbeat timestamp
5. On error → attempt reconnection with backoff
6. On unmount → close EventSource, cancel timers

### 3. NotificationBell Component

**Responsibilities:**

- Display bell icon (Lucide: `<Bell />`)
- Show unread count badge
- Toggle dropdown on click
- Position dropdown below bell

**Visual States:**

- Default: Gray bell icon
- Has unread: Blue/red bell icon with badge
- Dropdown open: Highlighted bell

**Badge Logic:**

- Show number if unreadCount > 0 and < 100
- Show "99+" if unreadCount >= 100
- Hide badge if unreadCount === 0

### 4. NotificationDropdown Component

**Responsibilities:**

- Render list of recent notifications (10-15)
- Show empty state if no notifications
- "View All" link to full notifications page
- **Mark all as read on close**

**Layout:**

- Fixed/absolute positioned popup
- Max height with scroll
- Group by date (Today, Yesterday, Earlier)
- Each item shows severity icon + title + time ago

**Mark as Read Logic:**

- Track all visible notification IDs
- On unmount (dropdown closes) → call `markNotificationsAsRead(ids)`
- Optimistically update state (set readAt locally)
- API call in background

### 5. NotificationItem Component

**Responsibilities:**

- Display single notification
- Visual indicator for unread (dot or background color)
- Severity-based icon (Info, Success, Warning, Error)
- Clickable if has deepLink (except VERIFICATION_EVENT)
- Time ago display (e.g., "5 minutes ago")

**Clickability Rules:**

- **AD_EVENT, REPORT_EVENT, SYSTEM_ANNOUNCEMENT:** If has `deepLink`, navigate on click
- **VERIFICATION_EVENT:** Non-clickable, just display (gray out or no hover effect)

**Visual Design:**

```
[Icon] Title                      [Time]
       Body text preview...       [Unread dot]
```

### 6. NotificationToast Component

**Responsibilities:**

- Show toast when new notification arrives via SSE
- Display for 5-7 seconds
- Clickable to navigate if has deepLink
- Dismiss button
- Don't show if user is on notifications page

**Toast Behavior:**

- Position: Top-right or bottom-right
- Auto-dismiss after 5s
- Stack multiple toasts vertically
- Animate in/out smoothly

**Library Recommendation:** Use `sonner` or `react-hot-toast` - both have excellent UX and are lightweight

### 7. NotificationsPage Component (Full View)

**Responsibilities:**

- Display all notifications with infinite scroll
- Filter by type (tabs: All, Ads, Verifications, Reports, System)
- Show empty state per filter
- **Mark all as read on page unmount**
- Pull-to-refresh on mobile (optional)

**Layout:**

- Header with title and filters
- List of notifications (similar to dropdown items)
- Load more on scroll
- Visual separator between read/unread

**Mark as Read Logic:**

- Track all notification IDs loaded on page
- On unmount → call `markNotificationsAsRead(allIds)`
- Same optimistic update pattern

---

## Phase 4: Notification Creation Flow

### Server-Side Notification Service

**Create a reusable notification service:**

**Location:** `/lib/services/notificationService.ts`

**Functions:**

1. **`createNotification(params)`**
   - Insert into database via Prisma
   - Return created notification
   - Publish to SSE stream for userId

2. **`publishToSSE(userId, notification)`**
   - Look up active SSE connections for userId
   - Send formatted SSE event
   - Handle if no active connections (user offline)

3. **Specific creator functions:**
   - `notifyAdStatusChange(userId, ad, newStatus)`
   - `notifyVerificationResult(userId, verification, result)`
   - `notifyReportResolution(userId, report, resolution)`
   - `notifySystemAnnouncement(userId, message)`

### Integration Points

**When to create notifications:**

1. **Moderator approves/rejects ad:**
   - After updating ad status in database
   - Create notification: type=AD_EVENT, severity=SUCCESS/WARNING
   - Include deepLink to ad details page

2. **Moderator approves/rejects verification:**
   - After updating verification status
   - Create notification: type=VERIFICATION_EVENT, severity=SUCCESS/ERROR
   - NO deepLink (non-clickable)

3. **Report gets resolved:**
   - After moderator closes/dismisses report
   - Create notification: type=REPORT_EVENT, severity=INFO
   - Include deepLink to report or reported ad

4. **System announcements:**
   - Manual trigger or scheduled job
   - Create notification: type=SYSTEM_ANNOUNCEMENT, severity=INFO/WARNING
   - Optional deepLink to blog post or help article

---

## Phase 5: State Management & Caching

### NotificationContext State Flow

**Initial Load:**

1. User logs in → NotificationProvider mounts
2. Fetch initial notifications (GET `/api/notifications`)
3. Fetch unread count (or calculate from initial data)
4. Open SSE connection
5. Render app with notification data

**Real-Time Updates:**

1. SSE event received → parse notification
2. Dispatch ADD_NOTIFICATION action
3. Prepend to notifications array
4. Increment unreadCount
5. Show toast with notification content

**Mark as Read:**

1. User closes dropdown/page → collect visible notification IDs
2. Filter only unread notifications (readAt === null)
3. Optimistically update local state (set readAt = now)
4. Decrement unreadCount by number marked
5. Call API `/api/notifications/mark-read` with IDs
6. If API fails → rollback state, show error toast

### Optimistic Updates Strategy

**Why:** Instant UI feedback, better UX

**How:**

1. Update state immediately
2. Fire API request asynchronously
3. On success: no action needed
4. On failure: revert state, show error

**For mark-as-read:**

- Low risk of failure
- User doesn't need to know about background sync
- Only show error if persistent failure

---

## Phase 6: Performance Optimizations

### 1. Pagination Strategy

**Dropdown:** Show only recent 10-15 notifications, no pagination needed

**Full Page:** Implement infinite scroll

- Load 30 notifications initially
- Load 20 more when user scrolls to bottom
- Use cursor-based pagination (last `createdAt` + `id`)
- Track `hasMore` flag to stop loading

### 2. Caching Strategy

**Notification List:**

- Cache in React state (NotificationContext)
- No need for localStorage (SSE keeps it fresh)
- Refresh on page reload (acceptable)

**Unread Count:**

- Update immediately on new notification
- Decrement when marking as read
- Occasional background sync for accuracy

### 3. Connection Management

**Multiple Tabs:**

- Each tab opens its own SSE connection
- Server handles multiple connections per user
- All tabs receive same notifications
- Use BroadcastChannel API to sync state across tabs (optional)

**Reconnection:**

- Exponential backoff: 1s → 2s → 5s → 10s → 30s
- Max 5 attempts, then stop and show "offline" message
- Reset on successful connection
- Refetch notifications after reconnection to catch missed events

### 4. Database Optimization

**Your current indexes are perfect:**

- `@@index([userId, readAt, createdAt])` - fast unread queries
- `@@index([adId])`, `@@index([verificationId])`, `@@index([reportId])` - fast joins

**Additional recommendations:**

- Consider archiving notifications older than 90 days (soft delete)
- Add database-level cleanup job
- Monitor query performance, add indexes if needed

---

## Phase 7: User Experience Details

### Notification Severity Styling

**INFO (Blue):**

- Icon: Info circle
- Use for general updates, status changes

**SUCCESS (Green):**

- Icon: Check circle
- Use for approvals, successful actions

**WARNING (Yellow/Orange):**

- Icon: Alert triangle
- Use for pending actions, rejections

**ERROR (Red):**

- Icon: X circle
- Use for critical issues, failures

### Time Display

Use relative time:

- Just now (< 1 minute)
- X minutes ago (< 60 minutes)
- X hours ago (< 24 hours)
- Yesterday (24-48 hours)
- Date (> 48 hours): "Jan 15, 2025"

Library: `date-fns` with `formatDistanceToNow`

### Empty States

**No notifications:**

- Icon + message: "No notifications yet"
- Friendly illustration

**No unread:**

- "You're all caught up!"
- Checkmark icon

**Filtered view empty:**

- "No [type] notifications"
- Button to clear filter

### Loading States

**Initial load:**

- Skeleton loaders in dropdown/page
- Bell icon shows loading spinner

**Infinite scroll:**

- Spinner at bottom of list
- "Loading more..." text

---

## Phase 8: Security Considerations

### 1. Authentication & Authorization

**SSE Endpoint:**

- Verify session/JWT before establishing connection
- Reject unauthorized requests immediately
- Use secure session cookies (httpOnly, secure, sameSite)

**API Routes:**

- Validate user owns notifications before returning
- Prevent users from marking others' notifications as read
- Rate limit to prevent abuse

### 2. Input Validation

**Notification Creation:**

- Sanitize title and body to prevent XSS
- Validate deepLink format (must be relative path)
- Validate data JSON structure

**Mark as Read:**

- Validate notification IDs are integers
- Verify user owns those notifications
- Limit batch size (e.g., max 100 IDs per request)

### 3. Rate Limiting

**SSE Connections:**

- Limit connections per user (e.g., max 5)
- Prevent connection spam

**API Endpoints:**

- Standard rate limits (e.g., 100 req/min per user)
- Stricter limits on mark-as-read to prevent abuse

---

## Phase 9: Testing Strategy

### Unit Tests

**NotificationService:**

- Test notification creation
- Test SSE publishing
- Mock database calls

**API Routes:**

- Test authentication
- Test authorization
- Test query parameters
- Test error handling

### Integration Tests

**SSE Connection:**

- Test connection establishment
- Test reconnection logic
- Test message delivery
- Test cleanup on disconnect

**Mark as Read Flow:**

- Test bulk update
- Test optimistic updates
- Test rollback on error

### E2E Tests

**User Scenarios:**

1. User logs in → sees notification bell
2. Moderator approves ad → user receives toast + bell badge updates
3. User opens dropdown → sees new notification
4. User closes dropdown → notification marked as read
5. User opens notifications page → sees all notifications
6. User leaves page → all visible marked as read

## Key Differences From Generic Implementation

✅ **Auto-mark as read:** On dropdown/page close, not individual clicks
✅ **Verification non-clickable:** Type-specific interaction rules
✅ **SSE-focused:** No WebSocket complexity
✅ **Limited notification types:** Simpler state management
✅ **Toast on arrival:** Real-time feedback for user engagement
✅ **No email integration:** Focused on in-app only

This implementation gives you a production-ready notification system that's simple to maintain, performant, and provides excellent UX. The SSE approach is perfect for your scale and requirements.
