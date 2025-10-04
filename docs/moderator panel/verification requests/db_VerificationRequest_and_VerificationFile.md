## Prisma models — `VerificationRequest` & `VerificationFile`

```prisma
// --- Enums ---

enum VerificationMethod {
  LANDMARK_SELFIE    // selfie with recognizable city landmark
  STUDENT_CARD
  IDENTITA
  PERMESSO
  RENTAL_CONTRACT
  OTHER
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum VerificationFileRole {
  IMAGE
  DOCUMENT
  OTHER
}

enum VerificationRejectionCode {
  INSUFFICIENT_PROOF
  CITY_MISMATCH
  EXPIRED_DOCUMENT
  UNREADABLE
  OTHER
}

// --- Models ---

model VerificationRequest {
  id                 Int                  @id @default(autoincrement())

  userId             Int
  cityId             Int

  method             VerificationMethod
  status             VerificationStatus   @default(PENDING)

  // Timestamps
  submittedAt        DateTime             @default(now())
  reviewedAt         DateTime?

  // Reviewer (moderator/admin)
  reviewedByUserId   Int?

  // Free-form user note (optional context)
  userNote           String?

  // Reviewer/canned reasons on rejection (optional)
  rejectionCode      VerificationRejectionCode?
  rejectionNote      String?

  // Attachments (PRIVATE storage)
  files              VerificationFile[]

  // Bookkeeping
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  @@map("verification_requests")
  @@index([userId, status])
  @@index([cityId, status])
  @@index([status, submittedAt])
}

model VerificationFile {
  id               Int                   @id @default(autoincrement())

  verificationId   Int
  verification     VerificationRequest   @relation(fields: [verificationId], references: [id], onDelete: Cascade)

  role             VerificationFileRole  @default(DOCUMENT)

  // Private object storage (derive signed URL server-side)
  storageKey       String                @db.VarChar(512)
  mimeType         String?               @db.VarChar(100)
  bytes            Int?

  createdAt        DateTime              @default(now())

  @@map("verification_files")
  @@index([verificationId])
  @@unique([storageKey]) // prevent duplicate uploads referencing same key
}
```

### Implementation notes & safeguards

- **City-scoped verification:** Each request is tied to a `cityId`. On **city change**, set `profiles.verified = false` and prompt re-verification; do **not** mutate old requests.
- **One active approval per user+city (recommended):** enforce via **partial unique index** at the DB layer (Prisma can’t express this natively). Migration example:

  ```sql
  CREATE UNIQUE INDEX uq_verified_per_user_city
    ON verification_requests (user_id, city_id)
    WHERE status = 'APPROVED';
  ```

- **Privacy:** Store files in a **private bucket**; serve via **signed URLs** to moderators only. Never expose `storageKey` publicly.
- **Workflow:** On approval, update `profiles.verified=true` and `profiles.verifiedAt=now()` (and only if `profile.cityId` == `verification.cityId`).
- **Auditability:** Log moderator actions in `moderation_actions` (who/when/decision/reason) and your general `audit_logs`.
