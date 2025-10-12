Love this—let’s shape a crisp, efficient **Moderator Panel**. I’ll go deep on **Verification Requests** (your example), then list all the other tabs with what they do and the key actions/filters each needs.

---

# Verification Requests (primary queue)

**Goal:** Review user proofs of residency (city-scoped), decide **Approve / Reject / Request changes**, and keep an auditable trail.

## Queue list

- **Default view:** `PENDING` requests, newest first.
- **Quick filters:** Status (Pending/Approved/Rejected), City, Method (Landmark selfie / Student card / Identità / Permesso / Rental contract / Other), Submitted date (today, last 7d), **SLA** (e.g., >24h pending), **Assigned to me**, **Unassigned**, User (search by username).
- **Sort:** Newest / Oldest / SLA (longest waiting).
- **Badges:** `CITY ≠ PROFILE` (mismatch), `RESUBMIT` (user has prior rejection), `TRUSTED?` (optional, e.g., many approved ads, low report rate).

## Review UI (drawer/modal)

- **Left pane:** Request metadata
  - User + Italihub ID (username), **Profile city**, request **city**, method, submittedAt.
  - Prior verifications (history), previous rejections (codes/notes).
  - User snapshot: verified? ads posted? reports? strikes? (read-only heads-up).

- **Center pane:** **Document viewer**
  - Thumbnails → click to zoom; rotate; view EXIF (when present).
  - Render private files via **short-lived signed URLs**.
  - Optional overlay “Italihub review only” (rendered image, not stored).

- **Right pane:** Actions & notes
  - **Approve** (primary): confirms city == profile city (warn if mismatch), set `VerificationRequest.status = APPROVED`, write `ModerationAction`, set `Profile.verified = true`, `verifiedAt = now()`; notify user.
  - **Reject**: choose **RejectionCode** (Insufficient proof / City mismatch / Expired document / Unreadable / Other) + note; write `ModerationAction`; notify user.
  - **Request changes**: (optional flow) send a templated message via **Notification** with exactly what’s missing; keep status = `PENDING` or create a new `PENDING` revision—your choice.
  - **Internal note** (private, saved to `ModerationAction.reasonText` or a small `internalNotes` field if you add one).
  - **Assignment:** Claim/Unclaim (“Assigned to me”) to avoid collisions.

## Safeguards & rules

- **One APPROVED per user+city** (DB partial unique already planned).
- If **profile city ≠ request city** → show **CITY_MISMATCH** banner; recommend user update city then resubmit. Don’t “fix” profile here.
- **Audit everything:** Create a `ModerationAction` on each decision; also write to `audit_logs`.
- **Security:** Only moderators/admins can fetch signed URLs; URLs expire quickly; downloads disabled by default.

## Quality-of-life

- **Keyboard shortcuts:** `A` Approve, `R` Reject, `C` Request changes, `J/K` next/prev, `Enter` open, `Esc` close.
- **Canned reasons** library (edit by admins).
- **Bulk actions:** (optional) multi-select → Approve/Reject with same reason (use carefully; require preview).
- **SLA counters:** show how many are waiting >24h / >48h.

---

# Other tabs (full panel map)

## 1) Overview (moderation home)

- **KPIs:** Pending verifications, Pending ads (by category), Open reports, Today’s approvals/rejections, SLA breaches.
- **Trends:** 7-day moderation throughput, top rejection reasons.
- **Quick links:** “Review Currency Exchange queue”, “Expiring soon (Housing/Transportation)”.

## 2) Ads Queue (all categories)

- **Goal:** Approve/Reject/Request changes for ads in `PENDING`; handle **Edit**/**Renew** flows.
- **Filters:** Category (Housing / Transportation / Marketplace / Services / Currency), City, Submitted date, **Edited/Renewed only**, Attachments present (Y/N), Reporter flags (has open reports).
- **Card preview:** Title (or primary fields for categories without titles), city, user, createdAt, **policy acceptance version**, images (if allowed), auto-derived **expiration date** (Housing=availabilityStart; Transportation=flightDate).
- **Detail actions:**
  - **Approve** → status `ONLINE` (auto-expires for H/T).
  - **Reject** (reason code + note) → status `REJECTED`.
  - **Request changes** (optional) → nudge user via Notification; keep `PENDING`.
  - **Edit (moderator)** (optional) → small text fix; write `ModerationAction: EDIT_NOTE`.
  - **Open in public view** (read-only preview).

- **Special lanes:**
  - **Currency Exchange** (risk lane): show **Verified** badge, side/amount, settlement methods, rate type; block images (enforced).
  - **Housing**: show image gallery, price, bills policy, household gender rules; highlight **availabilityStartDate** (also used as expiration).
  - **Transportation**: ensure **flightDate** exists; images disabled; accepted/restricted items visible.

- **Bulk approve** (optional, admin-only): for **trusted users** bucket, still logs actions.

## 3) Reports (user ad reports)

- **Queue:** `OPEN` reports, newest first; filters by reason (Fraud/Prohibited/Duplicate/Offensive/etc.), City, Category, Reporter.
- **Review:** Show ad content + history + owner profile + reporter details (if authenticated). Attachments via signed URLs.
- **Actions:** `CLOSE` with **Outcome** (No action / Ad removed / Ad edited / User warned / Other) + resolution note; write `ModerationAction (REPORT)`.
- **Helpers:** merge duplicate reports, link to ad’s moderation history.

## 4) Users & Profiles

- **Search:** by username, Telegram handle, name, email (if you fetch from auth).
- **View profile:** identity, city, verified, last city change, ad counts, report history.
- **Actions (admin-only):**
  - **Change role** (since roles are in User table—surface controls here).
  - **Sanctions** (optional V2): temporary posting suspension, rate limits.
  - **Force verify revoke** (edge cases) with reason (writes `ModerationAction`).

- **Privacy:** read-only for most data; avoid editing user content except for clear policy/admin cases.

## 5) Announcements

- **List:** Active/scheduled/expired; filters by scope (GLOBAL/CITY), audience (All/Verified/Mods/Admins), severity, pinned.
- **Create/edit:** title, body (markdown), scope/city, audience, starts/ends, pinned, dismissible, deepLink.
- **Preview:** render as users see; **Reads** chart (from `announcement_reads`).
- **Actions:** publish/unpublish; duplicate as new; write `ModerationAction` (or admin action) on create/update.

## 6) Notifications (optional now; nice in MVP)

- **Compose:** send a one-off **Notification** to a user (e.g., custom rejection clarification).
- **Templates:** canned messages for common cases (admin-managed).
- **Logs:** see last N notifications for a user; delivery state (read/unread timestamp).

## 7) Policies

- **List:** PostingPolicy versions by category; active vs retired.
- **Create vN+1:** paste Markdown, set effectiveFrom, (optionally) retire previous vN.
- **Stats:** acceptance counts per version, % of posters on current version.
- **Safety:** can’t delete an active policy with existing acceptances; must retire first.

## 8) Cities

- **Manage:** add/disable cities, edit `altNames`, set `sortOrder`, update lat/lng.
- **Guards:** can’t delete a city referenced by profiles/ads; only deactivate.

## 9) Audit & Moderation Log (read-only)

- **Audit viewer:** filter by action, entity type/id, actor, IP, requestId, date range; CSV export.
- **Moderation actions:** quick history per ad/user/verification/report.

## 10) Metrics

- **Moderation KPIs:** approvals/day, rejection rate, median time to decision, per-category throughput.
- **Content KPIs:** top cities/categories by volume; **Online vs Pending vs Rejected vs Expired** counts; views/clicks trends (from `ad_metrics_daily`).
- **Quality:** top rejection codes, report outcomes.

## 11) Settings (panel-level)

- **Reason codes & templates:** manage rejection codes, banword lists, canned messages.
- **Queue settings:** SLA thresholds, default sort, “trusted posters” rules (if used).
- **Storage:** signed URL expiry defaults; download permissions (on/off).
- **Security:** session timeout for moderators; IP allowlists (optional).

---

## Implementation notes (panel-wide)

- **RBAC:** Visible tabs/actions depend on role (moderator/admin), with role info coming from **User** in your auth system.
- **Atomicity:** Each decision writes a `ModerationAction`, updates target (`ad`/`verification_request`/`ad_report`), and emits related `Notification`—all in a **single transaction**.
- **Performance:** Use DAL fetching with minimal joins; pre-load child table by `Ad.category`. Paginate queues aggressively.
- **Keyboard & bulk:** Keyboard shortcuts accelerate triage; bulk actions limited to admin or trusted queues.
- **Privacy:** Verification/report files are private; only fetch signed URLs when a reviewer opens the item.
- **Audit:** Everything sensitive is logged to `audit_logs` with `requestId`, actor, and outcome.

If you want, I can sketch a **wireframe** to show how the Verification drawer and Ads review page should look (fields, buttons, shortcuts) or generate a **minimal Next.js route structure** for `/mod`.
