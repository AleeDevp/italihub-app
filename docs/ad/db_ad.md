# Core Ads (TPT parent)

## `ads` — Field spec (parent table for all categories)

> Used by `ad_housing`, `ad_transportation`, `ad_marketplace`, `ad_service`, `ad_exchange`.

# Prisma models (paste-ready)

```prisma
// ===== Enums =====
enum AdCategory {
  HOUSING
  TRANSPORTATION
  MARKETPLACE
  CURRENCY
  SERVICES
}

enum AdStatus {
  PENDING
  ONLINE
  REJECTED
  EXPIRED
}


// ===== ads =====
model Ad {
  id                  Int        @id @default(autoincrement())
  userId              Int
  cityId              Int
  category            AdCategory
  status              AdStatus    @default(PENDING)
  expirationDate      DateTime?
  viewsCount          Int         @default(0)
  contactClicksCount  Int         @default(0)
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  // Gallery relation (many images)
  mediaAssets         MediaAsset[]  @relation("AdImages")

  // O(1) cover pointer for list/SEO cards
  coverMediaId        Int?
  coverMedia          MediaAsset?   @relation("AdCover", fields: [coverMediaId], references: [id])

  // Optional denormalized count (maintain in app code)
  mediaCount          Int           @default(0)


  // children relation “back-relations” (just one of them have value)
  housing             AdHousing?        // 1:1 from ad_housing (defined elsewhere)
  transportation      AdTransportation? // 1:1 from ad_transportation (defined elsewhere)
  marketplace         AdMarketplace?    // 1:1 from ad_marketplace (defined elsewhere)
  service             AdService?        // 1:1 from ad_service (defined elsewhere)
  currency            adCurrency?       // 1:1 from ad_currency (defined elsewhere)

  @@map("ads")
  @@index([cityId, category, status, createdAt])
  @@index([expirationDate])
  @@index([userId, createdAt])
}

```

## Implementation notes

- **Expiry logic:** App sets `Ad.expirationDate = housing.availabilityStartDate` (Housing) or `transportation.flightDate` (Transportation). Leave `null` for Marketplace, Currency Exchange, Services.

- **Moderation:** New or edited/renewed ads default to `PENDING`; only when get **approved** by moderators, they become `ONLINE`.

> - Two relations between `Ad` and `MediaAsset` use **different relation names**: `"AdImages"` for the gallery, `"AdCover"` for the single cover pointer.
> - Enforce “cover belongs to the ad” in app logic when setting `coverMediaId`.
> - Prefer storing **`storageKey`** (e.g., cloudinary). Build the CDN URL on the server so moving providers is trivial.
> - If you want to **avoid even one join** on list pages, you can also cache a `coverUrl` string in `ads` (optional). I usually skip this early and compute from `storageKey`.

### Category rules (enforced in app, not schema)

- **Housing:** multiple images allowed (gallery), choose a cover.
- **Marketplace:** multiple images allowed, choose a cover.
- **Services:** optional single poster; set `role = POSTER` and also set as cover if present.
- **Transportation / Currency:** **no images** → simply don’t create `media_assets` rows.

### guide for children relation (back-relations)

Why having "back-relations" is best:

- Erg
- **Ergonomics:** you keep the nice `include: { housing: true }` DX when you need details.
- **Performance safety:** the DAL ensures you only fetch the **one** child that matches `category`.
- **Type safety:** you can return a **discriminated union** so callers get correct types per category.

### What to do

1. **Keep back-relations on `Ad`:**

   ```prisma
   model Ad {
     // ...
     housing        AdHousing?
     transportation AdTransportation?
     marketplace    AdMarketplace?
     // ...
   }
   ```

2. **Create a DAL function that fetches the right child only:**

   ```ts
   // dal/ad.ts
   import { PrismaClient, AdCategory } from '@prisma/client';
   const prisma = new PrismaClient();

   export async function getAdWithDetails(id: number) {
     const base = await prisma.ad.findUnique({
       where: { id },
       select: { id: true, category: true, status: true, cityId: true, userId: true },
     });
     if (!base) return null;

     switch (base.category) {
       case AdCategory.HOUSING:
         return prisma.ad.findUnique({ where: { id }, include: { housing: true } });
       case AdCategory.TRANSPORTATION:
         return prisma.ad.findUnique({ where: { id }, include: { transportation: true } });
       case AdCategory.MARKETPLACE:
         return prisma.ad.findUnique({ where: { id }, include: { marketplace: true } });
       // the same for SERVICES/CURRENCY
       default:
         return base;
     }
   }
   ```

3. **Expose a discriminated union type for callers:**

   ```ts
   type AdWithDetails =
     | ({ category: 'HOUSING' } & { housing: AdHousing })
     | ({ category: 'TRANSPORTATION' } & { transportation: AdTransportation })
     | ({ category: 'MARKETPLACE' } & { marketplace: AdMarketplace });
   ```

4. **Team guardrail:** lint/code-review rule: **never** do `include: { housing: true, transportation: true, ... }` in feature code—always call the DAL.

5. **(Optional) Hard guard:** add a tiny wrapper around `prisma.ad.find*` in your codebase that forbids multi-child includes outside the DAL.

---
