## Prisma model — `Media_assets`

```prisma
enum MediaRole {
  GALLERY   // default gallery image(s)
  POSTER    // e.g., Services poster
}

enum MediaKind {
  IMAGE
}

model MediaAsset {
  id          Int       @id @default(autoincrement())

  // Gallery relationship
  adId        Int
  ad          Ad        @relation("AdImages", fields: [adId], references: [id], onDelete: Cascade)

  kind        MediaKind @default(IMAGE)
  role        MediaRole @default(GALLERY)

  // Provider-agnostic key (e.g., "ads/123/abc.jpg"); build CDN URL at runtime
  storageKey  String    @db.VarChar(512)
  mimeType    String?   @db.VarChar(100)
  checksum    String?   @db.VarChar(64)

  alt         String?
  order       Int       @default(0)

  // Optional metadata
  width       Int?
  height      Int?
  bytes       Int?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("media_assets")
  @@index([adId])
  @@index([role, adId, order])
  @@unique([adId, order]) // stable per-ad ordering
  @@unique([storageKey])  // avoid duplicates
}



// In Ad (parent), keep:
model Ad {
  // ...
  mediaAssets    MediaAsset[] @relation("AdImages")
  coverMediaId   Int?
  coverMedia     MediaAsset?  @relation("AdCover", fields: [coverMediaId], references: [id])
  // ...
}
```

### Operational notes

* **Limit images per ad** (e.g., 12) in app logic.
* **Strip EXIF** on upload; keep `alt` for accessibility.
* Use `storageKey` → CDN URL mapping server-side so you can switch providers without data migration.
* **Partial unique (one POSTER per ad)** — enforce via a partial unique index:

  * Prisma can’t declare partial uniques natively; add via a **raw SQL migration**:

    ```sql
    CREATE UNIQUE INDEX media_assets_one_poster_per_ad
      ON media_assets(ad_id)
      WHERE role = 'POSTER';
    ```
* (Reminder) **Cover pointer on `ads`** — keep `ads.coverMediaId` and ensure app logic only points to a `MediaAsset` that belongs to the same `adId`.
