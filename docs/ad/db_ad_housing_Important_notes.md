- **Use transactions for multi-table writes**
  - Creating / updating a Housing ad should be **one atomic operation** (`Ad`, `AdHousing`, `MediaAsset[]`, `coverMediaId`, `mediaCount`).
  - Use something like `prisma.$transaction(async (tx) => { ... })` (or equivalent) so either everything is written or nothing is.

- **Separate input DTOs from DB models**
  - Define a **typed input object** for the DAL, e.g. `CreateHousingAdInput`, independent of the Prisma types.
  - The DAL is responsible for mapping this DTO → `Ad`, `AdHousing`, `MediaAsset` rows and setting all optional fields (`null` when not applicable).

- **Validation & normalization at the DAL boundary**
  - Use a schema validator (e.g. Zod) **before** calling DAL, or at the start of DAL functions, to ensure:
    - rentalKind is one of the expected enum values.
    - Temporary/Permanent–specific fields are present when required and `null` otherwise.
    - Dates, price, deposit, and bills fields are coherent (e.g. endDate ≥ startDate, non-negative amounts).

  - Normalize default values (e.g. empty strings, `null` vs `undefined`, trimmed text).

- **Rental-kind specific mapping logic inside DAL**
  - Centralize the rules:
    - If `rentalKind === "Temporary"` → set `availabilityEndDate`, `priceType = DAILY`, `billsPolicy = INCLUDED`, and **force** Permanent-only columns to `null`.
    - If `rentalKind === "Permanent"` → set `contractType`, `residenzaAvailable`, `priceType = MONTHLY`, `billsMonthlyEstimate`, etc.

  - DAL should guarantee that no “wrong” combinations reach the DB (e.g. temporary ad with `depositAmount` filled).

- **Ad + child entity creation contract**
  - Provide one high-level function like `createHousingAdWithMedia(input: CreateHousingAdInput): Promise<Ad>` that:
    1. Creates `Ad` with `category = HOUSING`.
    2. Creates `AdHousing` row with all housing-specific fields.
    3. Creates `MediaAsset[]` for gallery based on provided Cloudinary keys.
    4. Sets `coverMediaId` + `mediaCount` consistently.
    5. Sets initial `status = PENDING` and `expirationDate` according to rules.

- **Update vs. create DAL functions**
  - Separate functions:
    - `createHousingAdWithMedia`
    - `updateHousingAdWithMedia` (handles edits: add/remove images, reorder, change cover)

  - `update` should:
    - Respect the same rentalKind rules (e.g. switching from Permanent → Temporary must clear Permanent-only columns).
    - Recalculate `mediaCount` and ensure `coverMediaId` still points to a valid `MediaAsset` for that `adId`.

- **Strong typed relations & includes**
  - For DAL read operations (e.g. `getHousingAdById`), always include the correct child:
    - `include: { housing: true, mediaAssets: true }` when `category = HOUSING`.

  - Export return types as **discriminated unions** when needed (e.g. `HousingAdWithMedia` type).

- **Ownership & authorization baked into DAL queries**
  - For “my ads” operations, DAL should always filter by `userId` and `adId` together:
    - `where: { id: adId, userId: currentUserId }`.

  - Never trust `userId` coming directly from the client; it should be passed from the authenticated context into DAL.

- **Media ordering and uniqueness enforcement**
  - DAL should always set `order` sequentially (0,1,2,…) for new images and handle reordering.
  - When adding new media, check uniqueness of `storageKey` using `@@unique([storageKey])` and catch that error, either:
    - by ignoring duplicates, or
    - by surfacing a clear domain error.

- **Cover image invariants enforced in DAL**
  - When setting `coverMediaId`, DAL must ensure:
    - The target `MediaAsset` has `adId === Ad.id`.
    - `role` is compatible (e.g. `GALLERY` or `POSTER` depending on category).

  - Expose a small helper like `setAdCoverMedia(adId, mediaId)` that encapsulates these checks.

- **Status & lifecycle helpers**
  - Provide DAL functions for lifecycle transitions rather than setting status everywhere:
    - `submitHousingAdForReview(adId)` → sets `status = PENDING`.
    - `approveAd(adId)` → `status = ONLINE`.
    - `rejectAd(adId)` → `status = REJECTED`.

  - That keeps the status transitions centralized and consistent.

- **Expiry handling utilities**
  - Encapsulate expiry calculation in a helper inside DAL or a dedicated service:
    - Given housing `availabilityStartDate` (and maybe duration), compute `Ad.expirationDate`.

  - Expose functions like `refreshAdExpiration(adId)` when availability dates change.

- **Draft vs. published ads**
  - Consider supporting drafts:
    - `status = DRAFT` until the form is fully completed.
    - DAL function `saveHousingAdDraft(input)` that can accept partially filled data and skip some validations.
    - Another function `publishHousingAd(adId)` which performs the final strict validation and sets `PENDING`.

- **Next.js server-only DAL usage**
  - DAL files (`data/ads/ad-housing.ts`, `data/ads/ads.ts`) must be **server-only**:
    - No direct imports from client components.
    - Use them only inside server components, route handlers (`app/api/...`), or server actions.

  - If helpful, add `"use server"` boundaries in calling layers, not in the DAL itself.

- **Error handling & domain-specific errors**
  - Map low-level DB errors to domain errors (e.g. `AdNotFoundError`, `NotOwnerError`, `InvalidStateTransitionError`).
  - DAL should throw meaningful errors instead of leaking raw DB/Prisma messages.

- **Pagination & filtering helpers for listing**
  - For list pages, expose functions like:
    - `listHousingAdsByCity({ cityId, status, page, pageSize })`
    - `listUserHousingAds({ userId, status, page, pageSize })`

  - Always return results plus `totalCount` (for pagination UI).

- **Consistency between category and children table**
  - DAL must enforce that:
    - When `category = HOUSING`, exactly one `AdHousing` row exists.
    - No other child table (`AdMarketplace`, etc.) is created for that `adId`.

  - If a mismatch is detected (e.g. an `AdHousing` exists but `category !== HOUSING`), treat it as an invariant violation.

- **Data shaping for API/UI responses**
  - DAL can return **minimal data** for list views (`id`, title-like fields, price, city, cover media) and a richer shape for detail pages (all housing fields + media).
  - Consider separate read methods: `getHousingAdListItem` vs `getHousingAdDetail`.

- **Soft delete vs hard delete policy**
  - Decide if ads are ever deleted or only marked as inactive (`status = ARCHIVED` or similar).
  - DAL should provide `archiveAd(adId, userId)` or `deleteAd(adId, userId)` and ensure all child entities (housing, media_assets) follow the chosen policy.
