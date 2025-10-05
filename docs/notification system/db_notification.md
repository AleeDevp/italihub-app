## Prisma model — `Notification`


```prisma
enum NotificationType {
  AD_EVENT              // e.g., approved/rejected/pending/expired
  VERIFICATION_EVENT    // e.g., approved/rejected/needs-more-info
  REPORT_EVENT          // e.g., your report was closed/dismissed
  SYSTEM_ANNOUNCEMENT   // maintenance, policy updates, etc.
}

enum NotificationSeverity {
  INFO
  SUCCESS
  WARNING
  ERROR
}


model Notification {
  id               Int                  @id @default(autoincrement())

  // Recipient
  userId           Int

  // Classification
  type             NotificationType
  severity         NotificationSeverity  @default(INFO)

  // Content
  title            String               @db.VarChar(140)
  body             String               @db.VarChar(1000)

  // Optional deep links to context
  adId             Int?
  ad               Ad?                  @relation(fields: [adId], references: [id], onDelete: SetNull)

  verificationId   Int?
  verification     VerificationRequest? @relation(fields: [verificationId], references: [id], onDelete: SetNull)

  reportId         Int?
  report           AdReport?            @relation(fields: [reportId], references: [id], onDelete: SetNull)

  // Optional route or URL for front-end to navigate
  deepLink         String?              @db.VarChar(255)

  // Extra payload for client rendering (optional)
  data             Json?

  // Read state
  readAt           DateTime?

  // Timestamps
  createdAt        DateTime             @default(now())

  @@map("notifications")
  @@index([userId, readAt, createdAt])   // fast unread + recent sorting
  @@index([adId])
  @@index([verificationId])
  @@index([reportId])
}
```

### Notes & guidance

* **Unread handling:** `readAt IS NULL` = unread. Mark as read by setting `readAt = now()`.
* **Deep links:** store relative routes (e.g., `"/dashboard/ads?ad=123"`) to keep URLs environment-agnostic.
* **Payload (`data`) examples:** `{ "status": "APPROVED", "adCategory": "HOUSING" }`.
* **Triggers:** emit notifications on ad status transitions, verification approvals/rejections, report resolutions, and manual system messages.
* **Email:** if you later add email, keep that pipeline separate (don’t overload this table).
