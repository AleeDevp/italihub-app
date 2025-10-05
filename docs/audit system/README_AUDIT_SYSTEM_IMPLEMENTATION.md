# Audit System Documentation

## Overview

This audit system provides comprehensive logging for authentication events, mutations, and system actions in your Next.js application using better-auth and Prisma ORM.

## Architecture

### Core Components

1. **`audit.ts`** - Main audit library with logging functions
2. **`audit-context.ts`** - Utilities for extracting session and request context
3. **Database hooks in `auth.ts`** - Automatic audit logging for auth events
4. **Enhanced `middleware.ts`** - Request ID correlation for audit trails
5. **Updated action files** - Manual audit logging in server actions

### Database Schema

The audit system uses the `AuditLog` table with the following structure:

```prisma
model AuditLog {
  id              Int             @id @default(autoincrement())

  // WHO
  actorUserId     String?         // null when SYSTEM or unauthenticated
  actorRole       AuditActorRole? // snapshot of role at action time

  // WHAT
  action          AuditAction
  outcome         AuditOutcome
  errorCode       String?         @db.VarChar(64)

  // WHICH RESOURCE
  entityType      AuditEntityType
  entityId        Int?

  // CONTEXT
  requestId       String?         @db.VarChar(64)
  sessionId       String?         @db.VarChar(64)
  ip              String?         @db.VarChar(45)
  userAgent       String?         @db.VarChar(512)

  // DETAILS
  metadata        Json?           // sanitized metadata
  note            String?

  createdAt       DateTime        @default(now())

  @@map("audit_logs")
  @@index([createdAt])
  @@index([actorUserId, createdAt])
  @@index([entityType, entityId, createdAt])
  @@index([action, createdAt])
  @@index([requestId])
}
```

## Features

### Automatic Authentication Auditing

Authentication events are automatically logged through better-auth database hooks:

- ✅ User registration (success/failure)
- ✅ User login (success/failure)
- ✅ User logout
- ✅ OAuth linking/unlinking (success/failure)
- ✅ Password reset requests
- ✅ Session management

### Manual Server Action Auditing

Server actions can be wrapped with audit logging using the `auditServerAction` helper:

```typescript
import { auditServerAction } from '@/lib/audit';

export async function createAdAction(adData: AdCreateData) {
  const user = await requireUser();

  return await auditServerAction(
    'AD_CREATE',
    'AD',
    async () => {
      // Your actual business logic here
      const ad = await createAd(adData, user.id);
      return ad;
    },
    {
      actorUserId: user.id,
      actorRole: 'USER',
    },
    undefined, // entityId (will be filled after creation)
    'Creating new advertisement'
  );
}
```

### Security Features

- **Metadata Sanitization**: Automatically removes sensitive information (passwords, tokens, keys)
- **Field Length Limits**: Prevents buffer overflow by truncating long strings
- **Error Isolation**: Audit failures don't break main application functionality
- **Request Correlation**: Links related operations via request IDs

## Usage Guide

### 1. Basic Logging

```typescript
import { logSuccess, logFailure } from '@/lib/audit';

// Log successful operation
await logSuccess(
  'PROFILE_EDIT',
  'USER',
  { actorUserId: userId, actorRole: 'USER' },
  undefined,
  { changedFields: ['name', 'email'] },
  'User updated profile'
);

// Log failed operation
await logFailure(
  'AD_CREATE',
  'AD',
  'VALIDATION_ERROR',
  { actorUserId: userId, actorRole: 'USER' },
  undefined,
  { validationErrors: ['Title too long'] },
  'Ad creation failed validation'
);
```

### 2. Using AuthAuditor for Authentication Events

```typescript
import { AuthAuditor } from '@/lib/audit';

// Log successful registration
await AuthAuditor.logRegistrationSuccess('user@example.com', 'user-123', {
  emailVerified: false,
  provider: 'email',
});

// Log failed login
await AuthAuditor.logLoginFailure('user@example.com', 'INVALID_CREDENTIALS', {
  failureReason: 'Password incorrect',
  provider: 'email',
});
```

### 3. Server Action Wrapper

```typescript
import { auditServerAction } from '@/lib/audit';
import { getEnhancedAuditContext } from '@/lib/audit-context';

export async function deleteUserAction(userId: string) {
  const context = await getEnhancedAuditContext();

  return await auditServerAction(
    'ACCOUNT_DELETE',
    'USER',
    async () => {
      // Business logic
      await deleteUser(userId);
      return { success: true };
    },
    context,
    undefined,
    'User account deletion'
  );
}
```

### 4. Batch Logging

For high-volume operations:

```typescript
import { logAuditBatch } from '@/lib/audit';

const auditEntries = users.map((user) => ({
  action: 'EMAIL_SEND' as AuditAction,
  outcome: 'SUCCESS' as AuditOutcome,
  entityType: 'USER' as AuditEntityType,
  actorUserId: 'SYSTEM',
  actorRole: 'SYSTEM' as AuditActorRole,
  metadata: { email: user.email },
}));

await logAuditBatch(auditEntries);
```

## Implementation Status

### ✅ Completed Features

1. **Core Audit Library** (`audit.ts`)
   - Basic logging functions (`logAudit`, `logSuccess`, `logFailure`)
   - Auth-specific auditor class (`AuthAuditor`)
   - Server action wrapper (`auditServerAction`)
   - Batch logging (`logAuditBatch`)
   - Metadata sanitization
   - Request context extraction

2. **Authentication Integration**
   - Better-auth database hooks for automatic logging
   - Enhanced auth actions with failure logging
   - OAuth event tracking
   - Session management logging

3. **Infrastructure**
   - Request ID correlation via middleware
   - Session context extraction utilities
   - Enhanced audit context helpers

### 🔄 Recommended Next Steps

1. **Extend to All Server Actions**

   ```typescript
   // Add to remaining server actions
   import { auditServerAction } from '@/lib/audit';

   // Wrap existing actions like:
   // - Ad creation/editing/deletion
   // - Verification submissions
   // - Admin panel actions
   // - User profile updates
   ```

2. **Add Client-Side Error Tracking**

   ```typescript
   // For client-side failures that need auditing
   import { logFailure } from '@/lib/audit';

   try {
     // API call
   } catch (error) {
     await logFailure('API_CALL_FAILURE', 'OTHER', 'CLIENT_ERROR');
   }
   ```

3. **Create Audit Dashboard**
   - Admin panel for viewing audit logs
   - Filtering by user, action, date range
   - Export functionality for compliance

4. **Add Performance Monitoring**
   - Track operation durations in metadata
   - Monitor audit system performance
   - Alert on audit failures

## Best Practices

### 1. Security

- Never log passwords, tokens, or sensitive data
- Use metadata sanitization for all user input
- Limit field lengths to prevent attacks
- Review audit logs regularly for suspicious activity

### 2. Performance

- Use batch logging for bulk operations
- Consider async logging for non-critical operations
- Monitor audit table size and implement archiving
- Index frequently queried fields

### 3. Compliance

- Document data retention policies
- Implement log rotation and archiving
- Ensure audit logs are tamper-evident
- Regular compliance reviews

### 4. Monitoring

- Set up alerts for audit system failures
- Monitor audit log volume and patterns
- Track authentication anomalies
- Regular security reviews

## Configuration

### Environment Variables

No additional environment variables required. The system uses your existing:

- Database connection (via Prisma)
- Better-auth configuration
- Next.js request handling

### Prisma Schema Updates

Ensure your database includes the audit-related enums:

- `AuditAction`
- `AuditOutcome`
- `AuditActorRole`
- `AuditEntityType`

## Troubleshooting

### Common Issues

1. **Audit logs not appearing**
   - Check database connections
   - Verify enum values match schema
   - Check for console errors

2. **Request IDs not correlating**
   - Ensure middleware is properly configured
   - Check matcher patterns in middleware config
   - Verify header forwarding

3. **Authentication events missing**
   - Check better-auth database hooks
   - Verify session extraction logic
   - Check for async/await issues

### Debug Mode

Enable detailed logging by setting:

```typescript
// In audit.ts, uncomment console.log statements
console.log('Audit entry:', JSON.stringify(entry, null, 2));
```

## Support

For issues or questions:

1. Check console logs for audit system errors
2. Verify database schema matches expectations
3. Test with simple manual logging first
4. Review request/response headers for correlation IDs
