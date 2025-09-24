# Italihub Dashboard — Implementation Task Spec

> Agent brief: implement the entire **/dashboard** area (home + tabs) using Next.js App Router, TypeScript, Prisma, shadcn/ui (and OriginUI when needed). Follow this spec **exactly**. Keep code modular and reusable. No custom color styles; rely on shadcn tokens. All data access must go through **DAL files** and **server actions** as specified.

---

## 0) Context & Constraints

- **Routes (pages):**
  - `/dashboard` (Home)
  - `/dashboard/overview`
  - `/dashboard/ads`
  - `/dashboard/profile`
  - `/dashboard/verification`
  - `/dashboard/notifications`
  - `/dashboard/settings`
  - `/dashboard/support`

- **Auth:** Better Auth is integrated. On the **client**, use `useSession`. On the **server**, **always** use `lib/require-user.ts` (`requireUser()`).
- **Storage:** Cloudinary is already implemented. For **profile photos**, use existing files:
  - `components/avatar-upload-droppable.tsx`
  - `hooks/use-file-upload.ts`
  - `lib/actions/upload-image-cloudinary.ts`
  - `lib/actions/delete-profile-photo.ts`

- **Email:** `lib/email/resend.ts` exports `sendEmail` — use for settings & support flows (MVP).
- **Database:** Prisma models defined; access via `lib/db.ts`. Use **DAL files** per domain and **server actions** to mutate.
- **UI libraries:** shadcn/ui (primary), OriginUI components **when necessary**. No custom color overrides.
- **i18n:** English-only MVP.

---

## 1) Shared UI Components (build once, reuse)

- **`components/dashboard/widget.tsx`**
  - Props: `title`, `description?`, `ctaLabel`, `href`, `icon?`, `children?`
  - Uses shadcn `Card`. Clickable (wrap with `Link`). Keep sufficient padding and space for at-a-glance info.

- **`components/dashboard/status-badge.tsx`**
  - Map **AdStatus** → Badge variants: `ONLINE` (success), `PENDING` (warning), `REJECTED` (destructive), `EXPIRED` (secondary).

- **`components/dashboard/stat-chip.tsx`**
  - Small rounded counter chip (e.g., Online: 3).

- **`components/dashboard/skeleton.tsx`**
  - Cards, list rows, and text line placeholders for loading states.

- **`components/dashboard/pagination.tsx`**
  - Simple prev/next with page size selection.

Accessibility: semantic headings, labels, focus states, keyboard navigation, alt text for images.

---

## 2) DAL Contracts (exact signatures)

All DAL functions are **server-only** (no client import).

### `dal/ads.ts`

```ts
import { AdStatus, AdCategory } from "@prisma/client";

export type UserAdListParams = {
  userId: number;
  status?: AdStatus;                 // filter; default all
  q?: string;                        // search in child titles / notes
  page?: number;                     // 1-based
  pageSize?: number;                 // default 12
  sort?: "created-desc" | "created-asc";
};

export type UserAdListItem = {
  id: number;
  category: AdCategory;
  status: AdStatus;
  cityName: string;
  createdAt: Date;
  expirationDate?: Date | null;
  viewsCount: number;
  contactClicksCount: number;
  // Child projections
  title?: string | null;             // marketplace/service
  priceLabel?: string | null;        // e.g. €280/mo, or “Negotiable”
  summary?: string | null;           // short desc or derived snippet
  thumbnail?: string | null;         // storageKey (resolve via Cloudinary)
};

export async function getUserAdStats(userId: number): Promise<{
  online: number; pending: number; rejected: number; expired: number;
}>;

export async function listUserAds(p: UserAdListParams): Promise<{
  items: UserAdListItem[];
  total: number;
  page: number;
  pageSize: number;
}>;

export async function getAdForOwner(adId: number, userId: number): Promise<{
  ad: /* full parent row */;
  child: /* child row by category */;
}>;

// Mutations: EDIT / RENEW / DELETE
// Zod validation is done in server actions; DAL assumes valid input.
export async function editAdMarketplace(params: {/* ... */}): Promise<void>;
export async function editAdService(params: {/* ... */}): Promise<void>;

// Housing/Transportation use "renew" naming (same as edit but expiration recalculated)
export async function renewAdHousing(params: {/* ... includes availabilityStartDate */}): Promise<void>;
export async function renewAdTransportation(params: {/* ... includes flightDate */}): Promise<void>;

export async function deleteAd(adId: number, userId: number): Promise<void>;
```

Notes:

- On **any** edit/renew → set parent `status = PENDING` and recalc `expirationDate` for Housing/Transportation.
- Countdown data is computed on the UI using `expirationDate`.

### `dal/profile.ts`

```ts
export async function getProfile(userId: number): Promise<{
  firstName: string;
  lastName: string;
  username: string;
  telegramHandle: string;
  cityId: number;
  cityName: string;
  profilePhotoKey?: string | null;
  verified: boolean;
  verifiedAt?: Date | null;
  cityLastChangedAt?: Date | null;
}>;

export async function isUsernameAvailable(username: string): Promise<boolean>;

export async function updateProfileBasics(
  userId: number,
  data: {
    firstName: string;
    lastName: string;
    username: string; // must be unique (CITEXT)
    telegramHandle: string;
  }
): Promise<void>;

export async function changeCity(
  userId: number,
  newCityId: number
): Promise<{
  revokedVerification: boolean; // always true if verified before
}>;
```

App rules:

- Enforce **10-day cooldown** (throw a typed error).
- On city change: set `verified=false`, `verifiedAt = null`.

### `dal/verification.ts`

```ts
import { VerificationMethod, VerificationStatus } from '@prisma/client';

export async function getLatestVerification(userId: number): Promise<{
  id: number;
  status: VerificationStatus;
  cityId: number;
  submittedAt: Date;
  reviewedAt?: Date | null;
  rejectionCode?: string | null;
  rejectionNote?: string | null;
} | null>;

export async function submitVerificationRequest(
  userId: number,
  data: {
    cityId: number;
    method: VerificationMethod;
    userNote?: string;
    files: {
      storageKey: string;
      mimeType?: string | null;
      bytes?: number | null;
      role?: 'DOCUMENT' | 'SELFIE' | 'OTHER';
    }[];
  }
): Promise<{ requestId: number }>;
```

> For files: use your existing Cloudinary upload pipeline; store returned `storageKey` in `verification_files`.

### `dal/notifications.ts`

```ts
export async function getUnreadCount(userId: number): Promise<number>;
export async function listNotifications(
  userId: number,
  p?: { page?: number; pageSize?: number }
): Promise<{
  items: Array<{
    id: number;
    createdAt: Date;
    title: string;
    body: string;
    type: string;
    severity: string;
    readAt?: Date | null;
    deepLink?: string | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
}>;
export async function markRead(userId: number, id: number): Promise<void>;
export async function markAllRead(userId: number): Promise<void>;
```

### `dal/announcements.ts`

```ts
export async function listActiveAnnouncementsForUser(userId: number): Promise<
  Array<{
    id: number;
    title: string;
    body: string;
    severity: string;
    deepLink?: string | null;
    dismissible: boolean;
    pinned: boolean;
  }>
>;
export async function dismissAnnouncement(userId: number, announcementId: number): Promise<void>;
```

### `dal/metrics.ts`

```ts
export async function getOnlineAdsWithCounters(userId: number): Promise<
  Array<{
    adId: number;
    title?: string | null;
    views: number;
    clicks: number;
  }>
>;
```

### `dal/activity.ts`

```ts
export async function listRecentUserActivity(
  userId: number,
  limit = 20
): Promise<
  Array<{
    createdAt: Date;
    action: string;
    entityType: string;
    entityId?: number | null;
    outcome: string;
  }>
>;
```

### `dal/cities.ts`

```ts
export async function listCities(): Promise<Array<{ id: number; name: string }>>;
```

---

## 3) Server Actions (per route)

All mutations must be **server actions**; validate inputs with **zod**. Write `audit_logs` where appropriate.

### `/dashboard/ads/actions.ts`

- `editMarketplaceAction(formData)` → zod parse → `dal.ads.editAdMarketplace()` → set status to PENDING → success toast.
- `editServiceAction(formData)` → zod parse → `dal.ads.editAdService()` → status PENDING.
- `renewHousingAction(formData)` → zod parse (`availabilityStartDate`) → `dal.ads.renewAdHousing()`.
- `renewTransportationAction(formData)` → zod parse (`flightDate`) → `dal.ads.renewAdTransportation()`.
- `deleteAdAction(adId)` → confirmation → `dal.ads.deleteAd()`.

**Rules:**

- Only owner can mutate; check by querying `getAdForOwner()`.
- On submit, **enqueue** a notification “Your ad is pending review”.

### `/dashboard/profile/actions.ts`

- `updateProfileBasicsAction(formData)` → zod: `firstName,lastName,username,telegramHandle`
  - Check `isUsernameAvailable()` except when unchanged.
  - Success → toast; on username conflict → field error.

- `changeCityAction(newCityId)`
  - Enforce cooldown; show warning that verification is revoked.
  - After success, issue notification “City updated; verification cleared”.

> **Profile photo**: **Do not reimplement** — use provided components/actions.

### `/dashboard/verification/actions.ts`

- `submitVerificationAction(formData)`:
  - zod: `method`, `cityId`, optional note, array of Cloudinary `storageKey`s (ensure uploaded via your existing uploader).
  - Creates `verification_request` + files; sets status `PENDING`.
  - Notification to user: “Verification submitted”.

- Optional: prevent **multiple PENDING** submissions (allow only one open).

### `/dashboard/notifications/actions.ts`

- `markNotificationReadAction(id)`
- `markAllNotificationsReadAction()`
- `dismissAnnouncementAction(announcementId)`

### `/dashboard/settings/actions.ts`

- `changeEmailAction(newEmail)` → send confirmation via `sendEmail()` (MVP: just notify).
- `changePasswordAction(current, next)` → call Better Auth backend API (assume available); on success notify.
- `deleteAccountAction()` → confirmation modal → call auth + DB cleanup flow (MVP: stub with toast and TODO).

### `/dashboard/support/actions.ts`

- `sendSupportMessageAction({subject, message})` → calls `sendEmail({...})` to support inbox; include userId/username in email body.

---

## 4) Pages — UI & Behavior

### `/dashboard` (Home)

- **Widgets grid (3×3)** — one widget per tab:
  - Overview: show counts (Online/Pending/Rejected/Expired) via `dal.ads.getUserAdStats()`.
  - Ads Management: show **latest 3 ads** (title/summary + status badge).
  - Profile: show name, username (Italihub ID), city, verified badge, avatar.
  - Verification: show current status pill; CTA “Get verified”.
  - Notifications: show unread count; preview 3 recent.
  - Settings: quick links (Change email/password).
  - Support: CTA “Contact support”.

- All widgets link to respective tab routes.
- **Loading**: show skeletons while fetching.

### `/dashboard/overview`

- Display **Stats**: total ads, Online/Pending/Rejected/Expired.
- **Performance (mock)**: “This Month” views/clicks with **mock data** (no charts lib).
  - Component shows sparkline placeholder (CSS-only) or static bars.

- **Top Online Ads**: pull `dal.metrics.getOnlineAdsWithCounters()` and render a small table with views/clicks.
- **Recent Activity**: `dal.activity.listRecentUserActivity()` list (20 rows max).

### `/dashboard/ads`

- **Tabs/Pills**: All | Online | Pending | Rejected | Expired.
- **Filters**: Search (by title/summary), Sort (Newest/Oldest).
- **List**: Card per ad:
  - Category chip, Status badge, Title (if available), summary/excerpt, createdAt.
  - For **Housing/Transportation**: show “**Expires on Oct 13, 2025**” and a **countdown badge** (“3 days left” if <7 days).
  - Metrics mini: views / contact clicks (for ONLINE).
  - Actions:
    - **Housing/Transportation**: **Renew** (opens dialog with full edit form), Delete.
    - **Marketplace/Services/Currency**: **Edit**, Delete.

  - After **Edit/Renew**: show banner “Your ad is pending review”.

- **Empty states** for each tab.
- **Pagination**: 12 per page.

> **Edit/Renew forms**: reuse the same field sets as posting pages. Validate with zod. On success → toast + redirect back to the list with an updated status.

### `/dashboard/profile`

- **Read-only view** of:
  - First name, Last name, Username (Italihub ID), Telegram, City, Verified badge, Profile photo.

- **Edit** button opens dialog:
  - Editable fields: first name, last name, username (check availability async), telegram.
  - City selection (enforce cooldown; show warning that verification will be revoked).
  - Save → update + toast. If city changed, show “Verification removed, please re-verify”.

- **Profile photo** section:
  - Use `components/avatar-upload-droppable.tsx` & provided actions for upload and delete.

### `/dashboard/verification`

- **Status card**:
  - Shows: Verified (date), Pending (since), Rejected (code + note).

- **Submit form** (when not verified or after rejection):
  - Fields: method (select), city (auto-filled from profile, locked), note (optional), file upload (Cloudinary), file list preview.
  - Submit → create request, pending status.

- **Guidance**: list accepted proofs (landmark selfie, student card, Identità, Permesso, rental contract, etc.).

### `/dashboard/notifications`

- **Announcement banner(s)** on top (pinned first), with dismiss.
- **Notifications list**:
  - Icon by type, severity badge, title, time-ago, body, optional deepLink (“View ad”).
  - “Mark as read” per item; “Mark all as read”.

- **Pagination** (20 per page).

### `/dashboard/settings`

- **Change Email** form: email → `changeEmailAction` (sendEmail).
- **Change Password** form (assume Better Auth action available).
- **Danger Zone**: Delete account (confirm dialog).

### `/dashboard/support`

- **Support form**:
  - Subject, message (multi-line), attach username/userId in the email payload.
  - On submit → `sendEmail` to support address → toast success + reset form.

- **Helpful links**: Posting Policies, Verification Guide.

---

## 5) Validation (zod) — key schemas

Create `lib/zod.ts` with reusable pieces.

- `usernameSchema = z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/i)`
- `telegramSchema = z.string().min(2).max(64)`
- `cityIdSchema = z.number().int().positive()`
- `adIdSchema = z.number().int().positive()`
- Date fields: `z.coerce.date()`
- For price/amount, use `z.string()` → convert to `Decimal` server-side; allow empty for negotiable fields.

Use `safeParse` and map errors to field-level messages.

---

## 6) Policies, Permissions & Edge Cases

- **Access control:** For every server action, call `requireUser()`; for ad mutations, ensure `ad.userId === user.id`.
- **Edit/Renew puts ad into PENDING** always.
- **Renew (Housing/Transport)** recalculates `ads.expirationDate` using start/flight date.
- **Countdown**: If `expirationDate` in past & status ONLINE, show “Expired” and block renew until user updates dates (renew flow does that).
- **City change**: block if `< 10 days` since `cityLastChangedAt`; show remaining days in error.
- **Currency Exchange**: block posting/edit if user is **not verified** (already enforced in create; keep in edit too).
- **Notifications**: After profile city change → create in-app notification.

---

## 7) Toasts, Loading, Errors

- Use shadcn `useToast()` for success/error toasts.
- Each page shows skeleton while loading server data.
- For server action errors:
  - Field errors → inline under fields.
  - Global errors → destructive toast.

- 404/403: if a user tries to access another user’s ad, redirect to `/dashboard/ads` with error toast.

---

## 8) Telemetry & Audit

- On any mutation (profile update, city change, edit/renew/delete ad, verification submit), write `audit_logs`:
  - `action`: `PROFILE_EDIT`, `CITY_CHANGE`, `AD_EDIT`, `AD_RENEW`, `AD_DELETE`, `VERIFICATION_SUBMIT`
  - `metadata`: `{ changed: ["field1","field2"] }` (no secrets)

- Optional: write a notification for “Your ad was submitted for review”.

---

## 9) QA Checklist (acceptance criteria)

- **Routing**
  - All routes render with correct sidebar highlighting.
  - Unauthorized users are redirected to login; incomplete profile users cannot access dashboard (handled upstream).

- **Home widgets**
  - Counts reflect real DB state.
  - Clicking a widget goes to the correct tab.

- **Ads**
  - Tab filters work; pagination works.
  - Housing/Transport show expiration date + countdown; others do not.
  - Edit/Renew forms validate; after submit, status becomes PENDING and is visible as such.
  - Delete removes ad and associated media (cascade).

- **Profile**
  - Read-only by default; Edit opens dialog.
  - Username uniqueness check works; city change enforces 10-day cooldown and revokes verification.
  - Profile photo upload/delete works using existing actions.

- **Verification**
  - Status card reflects DB.
  - Submit creates `verification_request` with files (Cloudinary storageKey saved).
  - Prevents duplicate concurrent PENDING requests.

- **Notifications**
  - Announcements appear on top; dismiss persists.
  - Mark read and mark all read work.

- **Settings**
  - Change email triggers `sendEmail()`; change password form validates.
  - Delete account shows confirmation (MVP can be stubbed).

- **Support**
  - Submit sends email via `sendEmail()`; success toast; form resets.

- **A11y**
  - All controls reachable by keyboard; labels and aria attributes present.

- **No custom colors**
  - Components use shadcn tokens; OriginUI only when needed.

---

## 10) Notes for the Agent

- Prefer **server components** for data fetch (SSR), pass small props to client components for interactivity.
- Keep **all mutations** in **server actions** colocated with the route (e.g., `/dashboard/ads/actions.ts`) and call **DAL** inside.
- For images (thumbnails), build Cloudinary URLs client-side with a tiny helper (e.g., `cldUrlClient(storageKey,{ w: 600, crop:"fill" })`).
- Do **not** re-implement profile photo handling — use the provided components/actions.
- Use **shadcn/ui** primitives: Card, Tabs, Badge, Button, Dialog, Input, Textarea, Select, Alert, Tooltip, Toast, Skeleton.

---

## 11) Out of Scope (for now)

- Charts library (Recharts) — **postponed**; render mock stats/placeholders only.
- Messaging center, featured ads, saved/favorites — future versions.
- Admin/moderation panels — separate project area.

---

### Deliverables

- All pages and components compiled with no type errors.
- DAL files with tested queries.
- Server actions with zod validation and audit log writes.
- Screenshots/GIFs demonstrating each tab and core flows (edit/renew, city change, verification submit, notifications).

If you need seed data for local testing, generate a minimal set: 2 cities, 1 profile (verified), 5 ads (mix of categories/status), a couple of notifications, and 1 announcement.
