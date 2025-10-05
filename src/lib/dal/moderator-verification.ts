/**
 * Moderator DAL for Verification Requests
 *
 * This file contains all database operations needed for moderators
 * to review and manage user verification requests.
 */

import * as Enum from '@/generated/enums';
import type {
  AuditAction,
  AuditActorRole,
  AuditEntityType,
  VerificationFileRole,
  VerificationMethod,
  VerificationRejectionCode,
  VerificationStatus,
} from '@/generated/prisma';
import { auditServerAction, logFailure, logSuccess } from '@/lib/audit';
import { getEnhancedAuditContext } from '@/lib/audit-context';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/services/notification-service';

// =============================================================================
// Types for Moderator Operations
// =============================================================================

export interface VerificationRequestWithDetails {
  id: number;
  userId: string;
  status: VerificationStatus;
  method: VerificationMethod;
  cityId: number;
  submittedAt: Date;
  reviewedAt?: Date | null;
  reviewedByUserId?: string | null;
  userNote?: string | null;
  rejectionCode?: VerificationRejectionCode | null;
  rejectionNote?: string | null;
  filesCount: number;
  // User details
  user: {
    name?: string | null;
    userId?: string | null;
    email?: string | null;
    telegramHandle?: string | null;
    image?: string | null;
  };
  // City details
  city: {
    name: string;
    slug: string;
    region?: string | null;
  };
  // Files preview
  files: {
    id: number;
    storageKey: string;
    mimeType?: string | null;
    bytes?: number | null;
    role: VerificationFileRole;
    createdAt: Date;
  }[];
}

export interface VerificationSearchParams {
  search?: string; // Search in user name, email, userId, or notes
  status?: VerificationStatus;
  method?: VerificationMethod;
  cityId?: number;
  rejectionCode?: VerificationRejectionCode;
  dateFrom?: Date;
  dateTo?: Date;
  reviewedBy?: string; // Moderator who reviewed
  sortBy?: 'submittedAt' | 'reviewedAt' | 'status' | 'method' | 'cityId';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface VerificationListResult {
  requests: VerificationRequestWithDetails[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface VerificationStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageProcessingTimeHours: number;
  topRejectionReasons: { code: string; count: number }[];
  cityStats: { cityName: string; pending: number; total: number }[];
}

// =============================================================================
// Search and Pagination Functions
// =============================================================================

// Shared Prisma include for verification request details
const verificationDetailsInclude = {
  user: {
    select: {
      name: true,
      userId: true,
      email: true,
      telegramHandle: true,
      image: true,
    },
  },
  city: {
    select: {
      name: true,
      slug: true,
      region: true,
    },
  },
  files: {
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      bytes: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: {
    select: { files: true },
  },
} as const;

/**
 * Get verification requests with advanced search, filtering, and pagination
 * This is the main function for the moderator verification list
 */
export async function getVerificationRequestsForModerators(
  params: VerificationSearchParams,
  accessorUserId: string,
  accessorRole: AuditActorRole = 'MODERATOR'
): Promise<VerificationListResult> {
  const {
    search = '',
    status,
    method,
    cityId,
    rejectionCode,
    dateFrom,
    dateTo,
    reviewedBy,
    sortBy = 'submittedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = params;

  const offset = (page - 1) * limit;

  // Build where clause for filtering
  const where: any = {};

  // Status filter
  if (status) {
    where.status = status;
  }

  // Method filter
  if (method) {
    where.method = method;
  }

  // City filter
  if (cityId) {
    where.cityId = cityId;
  }

  // Rejection code filter
  if (rejectionCode) {
    where.rejectionCode = rejectionCode;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.submittedAt = {};
    if (dateFrom) where.submittedAt.gte = dateFrom;
    if (dateTo) where.submittedAt.lte = dateTo;
  }

  // Reviewed by filter
  if (reviewedBy) {
    where.reviewedByUserId = reviewedBy;
  }

  // Search filter - search in user name, email, userId, or notes
  if (search) {
    where.OR = [
      {
        user: {
          name: { contains: search, mode: 'insensitive' },
        },
      },
      {
        user: {
          email: { contains: search, mode: 'insensitive' },
        },
      },
      {
        user: {
          userId: { contains: search, mode: 'insensitive' },
        },
      },
      {
        userNote: { contains: search, mode: 'insensitive' },
      },
      {
        rejectionNote: { contains: search, mode: 'insensitive' },
      },
    ];
  }

  // Build orderBy clause
  const orderBy: any = {};
  switch (sortBy) {
    case 'submittedAt':
      orderBy.submittedAt = sortOrder;
      break;
    case 'reviewedAt':
      orderBy.reviewedAt = sortOrder;
      break;
    case 'status':
      orderBy.status = sortOrder;
      break;
    case 'method':
      orderBy.method = sortOrder;
      break;
    case 'cityId':
      orderBy.city = { name: sortOrder };
      break;
    default:
      orderBy.submittedAt = 'desc';
  }

  // Execute queries in parallel for better performance
  const [requests, total] = await Promise.all([
    prisma.verificationRequest.findMany({
      where,
      include: verificationDetailsInclude,
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.verificationRequest.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Transform data and add filesCount
  const requestsWithDetails: VerificationRequestWithDetails[] = requests.map((request) => ({
    id: request.id,
    userId: request.userId,
    status: request.status,
    method: request.method,
    cityId: request.cityId,
    submittedAt: request.submittedAt,
    reviewedAt: request.reviewedAt,
    reviewedByUserId: request.reviewedByUserId,
    userNote: request.userNote,
    rejectionCode: request.rejectionCode,
    rejectionNote: request.rejectionNote,
    filesCount: request._count.files,
    user: request.user,
    city: request.city,
    files: request.files,
  }));

  return {
    requests: requestsWithDetails,
    total,
    totalPages,
    page,
    limit,
  };
}

/**
 * Get detailed verification request by id for review dialog
 */
export async function getVerificationRequestById(
  requestId: number,
  accessorUserId: string,
  accessorRole: AuditActorRole = 'MODERATOR'
): Promise<VerificationRequestWithDetails | null> {
  const request = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    include: verificationDetailsInclude,
  });

  if (!request) {
    return null;
  }

  return {
    id: request.id,
    userId: request.userId,
    status: request.status,
    method: request.method,
    cityId: request.cityId,
    submittedAt: request.submittedAt,
    reviewedAt: request.reviewedAt,
    reviewedByUserId: request.reviewedByUserId,
    userNote: request.userNote,
    rejectionCode: request.rejectionCode,
    rejectionNote: request.rejectionNote,
    filesCount: request._count.files,
    user: request.user,
    city: request.city,
    files: request.files,
  };
}

// =============================================================================
// Statistics and Analytics Functions
// =============================================================================

/**
 * Get verification statistics for moderator dashboard
 */
export async function getVerificationStats(): Promise<VerificationStats> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    requestsThisWeek,
    requestsThisMonth,
    rejectionReasons,
    cityStats,
    processingTimes,
  ] = await Promise.all([
    prisma.verificationRequest.count(),
    prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
    prisma.verificationRequest.count({ where: { status: 'APPROVED' } }),
    prisma.verificationRequest.count({ where: { status: 'REJECTED' } }),
    prisma.verificationRequest.count({ where: { submittedAt: { gte: oneWeekAgo } } }),
    prisma.verificationRequest.count({ where: { submittedAt: { gte: oneMonthAgo } } }),
    // Top rejection reasons
    prisma.verificationRequest.groupBy({
      by: ['rejectionCode'],
      where: { status: 'REJECTED', rejectionCode: { not: null } },
      _count: { rejectionCode: true },
      orderBy: { _count: { rejectionCode: 'desc' } },
      take: 5,
    }),
    // City statistics
    prisma.$queryRaw`
      SELECT 
        c.name as "cityName",
        COUNT(CASE WHEN vr.status = 'PENDING' THEN 1 END)::int as "pending",
        COUNT(*)::int as "total"
      FROM "cities" c
      LEFT JOIN "verification_requests" vr ON c.id = vr."cityId"
      GROUP BY c.id, c.name
      HAVING COUNT(*) > 0
      ORDER BY "pending" DESC, "total" DESC
      LIMIT 10
    ` as Promise<{ cityName: string; pending: number; total: number }[]>,
    // Average processing time
    prisma.verificationRequest.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED'] },
        reviewedAt: { not: null },
      },
      select: {
        submittedAt: true,
        reviewedAt: true,
      },
      take: 1000, // Last 1000 processed requests
      orderBy: { reviewedAt: 'desc' },
    }),
  ]);

  // Calculate average processing time in hours
  let averageProcessingTimeHours = 0;
  if (processingTimes.length > 0) {
    const totalProcessingTimeMs = processingTimes.reduce((sum, req) => {
      if (req.reviewedAt) {
        return sum + (req.reviewedAt.getTime() - req.submittedAt.getTime());
      }
      return sum;
    }, 0);
    averageProcessingTimeHours = totalProcessingTimeMs / (processingTimes.length * 60 * 60 * 1000);
  }

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    requestsThisWeek,
    requestsThisMonth,
    averageProcessingTimeHours,
    topRejectionReasons: rejectionReasons.map((reason) => ({
      code: reason.rejectionCode || 'UNKNOWN',
      count: reason._count.rejectionCode,
    })),
    cityStats,
  };
}

// =============================================================================
// Moderator Action Functions
// =============================================================================

/**
 * Approve a verification request (moderator action)
 * Uses the existing function from verification.ts but with additional moderator context
 */
export async function moderatorApproveVerification(
  requestId: number,
  moderatorUserId: string,
  moderatorRole: AuditActorRole = 'MODERATOR'
): Promise<void> {
  const auditContext = await getEnhancedAuditContext();

  await auditServerAction(
    Enum.AuditAction.VERIFICATION_APPROVE as AuditAction,
    Enum.AuditEntityType.VERIFICATION_REQUEST as AuditEntityType,
    async () => {
      const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        select: { userId: true, status: true, cityId: true, method: true },
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      if (request.status !== 'PENDING') {
        throw new Error('Can only approve pending verification requests');
      }

      // Use transaction to ensure both updates succeed
      await prisma.$transaction(async (tx) => {
        // Update verification request
        await tx.verificationRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedByUserId: moderatorUserId,
          },
        });

        // Update user profile to mark as verified
        await tx.user.update({
          where: { id: request.userId },
          data: {
            verified: true,
            verifiedAt: new Date(),
          },
        });
      });
      // After DB updates succeed, create a notification to the user
      await createNotification({
        userId: request.userId,
        type: 'VERIFICATION_EVENT',
        severity: 'SUCCESS',
        title: 'Verification approved',
        body: 'Your verification request has been approved. You are now verified.',
        verificationId: requestId,
        deepLink: null,
        data: { method: request.method, cityId: request.cityId },
      });

      return;
    },
    {
      actorUserId: moderatorUserId,
      actorRole: moderatorRole,
      ...auditContext,
    },
    requestId,
    'Moderator approved verification request'
  );
}

/**
 * Reject a verification request (moderator action)
 * Uses the existing function from verification.ts but with additional moderator context
 */
export async function moderatorRejectVerification(
  requestId: number,
  moderatorUserId: string,
  rejectionData: {
    rejectionCode?: VerificationRejectionCode;
    rejectionNote?: string;
  },
  moderatorRole: AuditActorRole = 'MODERATOR'
): Promise<void> {
  const auditContext = await getEnhancedAuditContext();

  await auditServerAction(
    Enum.AuditAction.VERIFICATION_REJECT as AuditAction,
    Enum.AuditEntityType.VERIFICATION_REQUEST as AuditEntityType,
    async () => {
      const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        select: { status: true, userId: true, method: true },
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      if (request.status !== 'PENDING') {
        throw new Error('Can only reject pending verification requests');
      }

      const updated = await prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedByUserId: moderatorUserId,
          rejectionCode: rejectionData.rejectionCode,
          rejectionNote: rejectionData.rejectionNote,
        },
      });

      // Helper to humanize rejection codes for user-facing text
      const humanizeRejectionCode = (code?: VerificationRejectionCode) => {
        switch (code) {
          case 'INSUFFICIENT_PROOF':
            return 'Insufficient Proof';
          case 'CITY_MISMATCH':
            return 'City Mismatch';
          case 'EXPIRED_DOCUMENT':
            return 'Expired Document';
          case 'UNREADABLE':
            return 'Unreadable Document';
          case 'OTHER':
            return 'Other Reason';
          default:
            return 'Unspecified Reason';
        }
      };

      const reasonText = humanizeRejectionCode(rejectionData.rejectionCode);
      const bodyText = `Reason: ${reasonText}`;

      // Notify the user about the rejection
      await createNotification({
        userId: request.userId,
        type: 'VERIFICATION_EVENT',
        severity: 'ERROR',
        title: 'Verification rejected',
        body: bodyText,
        verificationId: requestId,
        deepLink: null,
        data: { method: request.method, rejectionCode: rejectionData.rejectionCode },
      });

      return;
    },
    {
      actorUserId: moderatorUserId,
      actorRole: moderatorRole,
      ...auditContext,
    },
    requestId,
    'Moderator rejected verification request'
  );
}

/**
 * Bulk action: Approve multiple verification requests
 */
export async function bulkApproveVerifications(
  requestIds: number[],
  moderatorUserId: string,
  moderatorRole: AuditActorRole = 'MODERATOR'
): Promise<{ successful: number[]; failed: { id: number; error: string }[] }> {
  const auditContext = await getEnhancedAuditContext();
  const successful: number[] = [];
  const failed: { id: number; error: string }[] = [];

  // Process each request individually to handle partial failures
  for (const requestId of requestIds) {
    try {
      await moderatorApproveVerification(requestId, moderatorUserId, moderatorRole);
      successful.push(requestId);
    } catch (error) {
      failed.push({
        id: requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Log bulk action
  await logSuccess(
    Enum.AuditAction.VERIFICATION_APPROVE as AuditAction,
    Enum.AuditEntityType.VERIFICATION_REQUEST as AuditEntityType,
    {
      actorUserId: moderatorUserId,
      actorRole: moderatorRole,
      ...auditContext,
    },
    undefined,
    {
      action: 'bulk_approve',
      requestIds,
      successful: successful.length,
      failed: failed.length,
    },
    `Bulk approved ${successful.length} verification requests`
  ).catch((error) => {
    console.error('Failed to log bulk approval:', error);
  });

  // If any failures occurred, log a failure audit with details
  if (failed.length > 0) {
    await logFailure(
      Enum.AuditAction.VERIFICATION_APPROVE as AuditAction,
      Enum.AuditEntityType.VERIFICATION_REQUEST as AuditEntityType,
      'BULK_PARTIAL_FAILURE',
      {
        actorUserId: moderatorUserId,
        actorRole: moderatorRole,
        ...auditContext,
      },
      undefined,
      {
        action: 'bulk_approve',
        requestIds,
        failed,
      },
      'Bulk approve had partial failures'
    ).catch((error) => {
      console.error('Failed to log bulk approval failure:', error);
    });
  }

  return { successful, failed };
}

/**
 * Bulk action: Reject multiple verification requests
 */
export async function bulkRejectVerifications(
  requestIds: number[],
  moderatorUserId: string,
  rejectionData: {
    rejectionCode?: VerificationRejectionCode;
    rejectionNote?: string;
  },
  moderatorRole: AuditActorRole = 'MODERATOR'
): Promise<{ successful: number[]; failed: { id: number; error: string }[] }> {
  const auditContext = await getEnhancedAuditContext();
  const successful: number[] = [];
  const failed: { id: number; error: string }[] = [];

  // Process each request individually to handle partial failures
  for (const requestId of requestIds) {
    try {
      await moderatorRejectVerification(requestId, moderatorUserId, rejectionData, moderatorRole);
      successful.push(requestId);
    } catch (error) {
      failed.push({
        id: requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Log bulk action
  await logSuccess(
    Enum.AuditAction.VERIFICATION_REJECT as AuditAction,
    Enum.AuditEntityType.VERIFICATION_REQUEST as AuditEntityType,
    {
      actorUserId: moderatorUserId,
      actorRole: moderatorRole,
      ...auditContext,
    },
    undefined,
    {
      action: 'bulk_reject',
      requestIds,
      successful: successful.length,
      failed: failed.length,
      rejectionCode: rejectionData.rejectionCode,
      rejectionNote: rejectionData.rejectionNote,
    },
    `Bulk rejected ${successful.length} verification requests`
  ).catch((error) => {
    console.error('Failed to log bulk rejection:', error);
  });

  // If any failures occurred, log a failure audit with details
  if (failed.length > 0) {
    await logFailure(
      Enum.AuditAction.VERIFICATION_REJECT as AuditAction,
      Enum.AuditEntityType.VERIFICATION_REQUEST as AuditEntityType,
      'BULK_PARTIAL_FAILURE',
      {
        actorUserId: moderatorUserId,
        actorRole: moderatorRole,
        ...auditContext,
      },
      undefined,
      {
        action: 'bulk_reject',
        requestIds,
        failed,
        rejectionCode: rejectionData.rejectionCode,
      },
      'Bulk reject had partial failures'
    ).catch((error) => {
      console.error('Failed to log bulk rejection failure:', error);
    });
  }

  return { successful, failed };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get all cities for filter dropdown
 */
// NOTE: City filter options, moderators filter, and CSV export have been removed from this DAL.
// - Cities are provided via useCities() on the client and cached application-wide.
// - Moderator list and CSV export endpoints can be reintroduced if needed in the future.
