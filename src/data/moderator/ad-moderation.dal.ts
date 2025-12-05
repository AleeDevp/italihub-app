/**
 * Moderator DAL for Ad Moderation
 *
 * This file contains all database operations needed for moderators/admins
 * to review and manage user ads (approve, reject, etc.).
 */

import * as Enum from '@/generated/enums';
import type {
  AdCategory,
  AdStatus,
  AuditAction,
  AuditActorRole,
  AuditEntityType,
  ModerationActionType,
  ModerationReasonCode,
} from '@/generated/prisma';
import { auditServerAction, logFailure, logSuccess } from '@/lib/audit/audit';
import { getEnhancedAuditContext } from '@/lib/audit/audit-context';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/services/notification-service';

// =============================================================================
// Types for Moderator Operations
// =============================================================================

export interface AdForModerationListItem {
  id: number;
  userId: string;
  category: AdCategory;
  status: AdStatus;
  cityId: number;
  createdAt: Date;
  updatedAt: Date;
  expirationDate: Date | null;
  viewsCount: number;
  contactClicksCount: number;
  // User details
  user: {
    id: string;
    name: string | null;
    userId: string | null;
    email: string | null;
    image: string | null;
    verified: boolean;
  };
  // City details
  city: {
    id: number;
    name: string;
    slug: string;
  };
  // Cover image
  coverMedia: {
    id: number;
    storageKey: string;
  } | null;
  // Category-specific title/summary (for list display)
  _categoryTitle: string | null;
  _categorySummary: string | null;
}

export interface AdForModerationDetails extends AdForModerationListItem {
  // All media assets
  mediaAssets: Array<{
    id: number;
    storageKey: string;
    alt: string | null;
    order: number;
  }>;
  // Category-specific details (one will be present based on category)
  housing: any | null;
  transportation: any | null;
  marketplace: any | null;
  service: any | null;
  // Moderation history
  moderationActions: Array<{
    id: number;
    actorUserId: string;
    action: ModerationActionType;
    reasonCode: ModerationReasonCode | null;
    reasonText: string | null;
    prevStatus: string | null;
    nextStatus: string | null;
    createdAt: Date;
    actor: {
      name: string | null;
      userId: string | null;
    };
  }>;
}

export interface AdModerationSearchParams {
  search?: string;
  status?: AdStatus;
  category?: AdCategory;
  cityId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'category' | 'cityId';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdModerationListResult {
  ads: AdForModerationListItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface AdModerationStats {
  totalAds: number;
  pendingAds: number;
  onlineAds: number;
  rejectedAds: number;
  expiredAds: number;
  adsThisWeek: number;
  adsThisMonth: number;
  categoryStats: { category: AdCategory; pending: number; total: number }[];
  cityStats: { cityName: string; pending: number; total: number }[];
}

// =============================================================================
// Shared Prisma Includes
// =============================================================================

const adListSelect = {
  id: true,
  userId: true,
  category: true,
  status: true,
  cityId: true,
  createdAt: true,
  updatedAt: true,
  expirationDate: true,
  viewsCount: true,
  contactClicksCount: true,
  user: {
    select: {
      id: true,
      name: true,
      userId: true,
      email: true,
      image: true,
      verified: true,
    },
  },
  city: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  coverMedia: {
    select: {
      id: true,
      storageKey: true,
    },
  },
  // For generating title/summary
  housing: {
    select: {
      unitType: true,
      propertyType: true,
      neighborhood: true,
      priceAmount: true,
      priceType: true,
    },
  },
  marketplace: {
    select: {
      title: true,
      price: true,
    },
  },
  service: {
    select: {
      title: true,
      serviceCategory: true,
    },
  },
  transportation: {
    select: {
      departureCity: true,
      arrivalCity: true,
      flightDate: true,
    },
  },
} as const;

const adDetailSelect = {
  ...adListSelect,
  mediaAssets: {
    select: {
      id: true,
      storageKey: true,
      alt: true,
      order: true,
    },
    orderBy: { order: 'asc' as const },
  },
  housing: true,
  transportation: true,
  marketplace: true,
  service: true,
  moderationActions: {
    select: {
      id: true,
      actorUserId: true,
      action: true,
      reasonCode: true,
      reasonText: true,
      prevStatus: true,
      nextStatus: true,
      createdAt: true,
      actor: {
        select: {
          name: true,
          userId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
    take: 20,
  },
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

function generateAdTitle(ad: any): string | null {
  switch (ad.category) {
    case 'HOUSING':
      if (ad.housing) {
        const unitType = ad.housing.unitType?.replace(/_/g, ' ').toLowerCase();
        const neighborhood = ad.housing.neighborhood;
        return neighborhood ? `${unitType} in ${neighborhood}` : unitType || null;
      }
      return null;
    case 'MARKETPLACE':
      return ad.marketplace?.title || null;
    case 'SERVICES':
      return ad.service?.title || null;
    case 'TRANSPORTATION':
      if (ad.transportation) {
        return `${ad.transportation.departureCity} → ${ad.transportation.arrivalCity}`;
      }
      return null;
    default:
      return null;
  }
}

function generateAdSummary(ad: any): string | null {
  switch (ad.category) {
    case 'HOUSING':
      if (ad.housing) {
        const price = ad.housing.priceAmount
          ? `€${Number(ad.housing.priceAmount).toLocaleString()}`
          : null;
        const priceType = ad.housing.priceType === 'DAILY' ? '/day' : '/month';
        return price ? `${price}${priceType}` : null;
      }
      return null;
    case 'MARKETPLACE':
      return ad.marketplace?.price ? `€${Number(ad.marketplace.price).toLocaleString()}` : null;
    case 'SERVICES':
      return ad.service?.serviceCategory?.replace(/_/g, ' ').toLowerCase() || null;
    case 'TRANSPORTATION':
      if (ad.transportation?.flightDate) {
        return new Date(ad.transportation.flightDate).toLocaleDateString();
      }
      return null;
    default:
      return null;
  }
}

function transformAdForList(ad: any): AdForModerationListItem {
  return {
    id: ad.id,
    userId: ad.userId,
    category: ad.category,
    status: ad.status,
    cityId: ad.cityId,
    createdAt: ad.createdAt,
    updatedAt: ad.updatedAt,
    expirationDate: ad.expirationDate,
    viewsCount: ad.viewsCount,
    contactClicksCount: ad.contactClicksCount,
    user: ad.user,
    city: ad.city,
    coverMedia: ad.coverMedia,
    _categoryTitle: generateAdTitle(ad),
    _categorySummary: generateAdSummary(ad),
  };
}

// =============================================================================
// Search and Pagination Functions
// =============================================================================

/**
 * Get ads with advanced search, filtering, and pagination for moderators
 */
export async function getAdsForModeration(
  params: AdModerationSearchParams
): Promise<AdModerationListResult> {
  const {
    search = '',
    status,
    category,
    cityId,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = params;

  const offset = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

  if (cityId) {
    where.cityId = cityId;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  // Search in user name, email, userId
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { userId: { contains: search, mode: 'insensitive' } } },
      { housing: { neighborhood: { contains: search, mode: 'insensitive' } } },
      { marketplace: { title: { contains: search, mode: 'insensitive' } } },
      { service: { title: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Build orderBy
  const orderBy: any = {};
  switch (sortBy) {
    case 'createdAt':
      orderBy.createdAt = sortOrder;
      break;
    case 'updatedAt':
      orderBy.updatedAt = sortOrder;
      break;
    case 'status':
      orderBy.status = sortOrder;
      break;
    case 'category':
      orderBy.category = sortOrder;
      break;
    case 'cityId':
      orderBy.city = { name: sortOrder };
      break;
    default:
      orderBy.createdAt = 'desc';
  }

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      select: adListSelect,
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.ad.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    ads: ads.map(transformAdForList),
    total,
    totalPages,
    page,
    limit,
  };
}

/**
 * Get detailed ad by ID for moderator review
 */
export async function getAdForModerationById(adId: number): Promise<AdForModerationDetails | null> {
  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    select: adDetailSelect,
  });

  if (!ad) return null;

  return {
    ...transformAdForList(ad),
    mediaAssets: ad.mediaAssets,
    housing: ad.housing,
    transportation: ad.transportation,
    marketplace: ad.marketplace,
    service: ad.service,
    moderationActions: ad.moderationActions,
  };
}

// =============================================================================
// Statistics Functions
// =============================================================================

/**
 * Get ad moderation statistics for dashboard
 */
export async function getAdModerationStats(): Promise<AdModerationStats> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalAds,
    pendingAds,
    onlineAds,
    rejectedAds,
    expiredAds,
    adsThisWeek,
    adsThisMonth,
    categoryStats,
    cityStats,
  ] = await Promise.all([
    prisma.ad.count(),
    prisma.ad.count({ where: { status: 'PENDING' } }),
    prisma.ad.count({ where: { status: 'ONLINE' } }),
    prisma.ad.count({ where: { status: 'REJECTED' } }),
    prisma.ad.count({ where: { status: 'EXPIRED' } }),
    prisma.ad.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.ad.count({ where: { createdAt: { gte: oneMonthAgo } } }),
    // Category statistics
    prisma.ad.groupBy({
      by: ['category'],
      _count: { category: true },
    }),
    // City statistics with pending count
    prisma.$queryRaw`
      SELECT 
        c.name as "cityName",
        COUNT(CASE WHEN a.status = 'PENDING' THEN 1 END)::int as "pending",
        COUNT(*)::int as "total"
      FROM "cities" c
      LEFT JOIN "ads" a ON c.id = a."cityId"
      GROUP BY c.id, c.name
      HAVING COUNT(*) > 0
      ORDER BY "pending" DESC, "total" DESC
      LIMIT 10
    ` as Promise<{ cityName: string; pending: number; total: number }[]>,
  ]);

  // Get pending count per category
  const pendingByCategory = await prisma.ad.groupBy({
    by: ['category'],
    where: { status: 'PENDING' },
    _count: { category: true },
  });

  const pendingMap = new Map(pendingByCategory.map((p) => [p.category, p._count.category]));

  return {
    totalAds,
    pendingAds,
    onlineAds,
    rejectedAds,
    expiredAds,
    adsThisWeek,
    adsThisMonth,
    categoryStats: categoryStats.map((c) => ({
      category: c.category,
      pending: pendingMap.get(c.category) || 0,
      total: c._count.category,
    })),
    cityStats,
  };
}

// =============================================================================
// Moderator Action Functions
// =============================================================================

export interface ApproveAdResult {
  success: boolean;
  error?: string;
}

export interface RejectAdResult {
  success: boolean;
  error?: string;
}

/**
 * Approve an ad (moderator action)
 * - Updates ad status to ONLINE
 * - Creates a ModerationAction record
 * - Logs audit entry
 * - Sends notification to ad owner
 */
export async function moderatorApproveAd(
  adId: number,
  moderatorUserId: string,
  moderatorRole: AuditActorRole = 'MODERATOR',
  note?: string
): Promise<ApproveAdResult> {
  const auditContext = await getEnhancedAuditContext();

  try {
    await auditServerAction(
      Enum.AuditAction.AD_APPROVE as AuditAction,
      Enum.AuditEntityType.AD as AuditEntityType,
      async () => {
        // Get the ad first
        const ad = await prisma.ad.findUnique({
          where: { id: adId },
          select: { id: true, userId: true, status: true, category: true },
        });

        if (!ad) {
          throw new Error('Ad not found');
        }

        if (ad.status !== 'PENDING') {
          throw new Error('Can only approve ads with PENDING status');
        }

        const prevStatus = ad.status;
        const nextStatus = 'ONLINE';

        // Use transaction for atomicity
        await prisma.$transaction(async (tx) => {
          // Update ad status
          await tx.ad.update({
            where: { id: adId },
            data: {
              status: nextStatus,
              updatedAt: new Date(),
            },
          });

          // Create moderation action record
          await tx.moderationAction.create({
            data: {
              actorUserId: moderatorUserId,
              adId: adId,
              targetType: 'AD',
              action: 'APPROVE',
              reasonText: note || null,
              prevStatus,
              nextStatus,
            },
          });
        });

        // Send notification to ad owner (outside transaction)
        await createNotification({
          userId: ad.userId,
          type: 'AD_EVENT',
          severity: 'SUCCESS',
          title: 'Ad Approved',
          body: 'Your ad has been approved and is now live.',
          adId: adId,
          deepLink: `/dashboard/ads-management/${adId}`,
          data: { category: ad.category, prevStatus, nextStatus },
        });

        return { success: true };
      },
      {
        actorUserId: moderatorUserId,
        actorRole: moderatorRole,
        ...auditContext,
      },
      adId,
      'Moderator approved ad'
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve ad';

    // Log failure
    await logFailure(
      Enum.AuditAction.AD_APPROVE as AuditAction,
      Enum.AuditEntityType.AD as AuditEntityType,
      'APPROVE_FAILED',
      {
        actorUserId: moderatorUserId,
        actorRole: moderatorRole,
        ...auditContext,
      },
      adId,
      { error: errorMessage },
      'Failed to approve ad'
    ).catch(console.error);

    return { success: false, error: errorMessage };
  }
}

/**
 * Reject an ad (moderator action)
 * - Updates ad status to REJECTED
 * - Creates a ModerationAction record with reason
 * - Logs audit entry
 * - Sends notification to ad owner
 */
export async function moderatorRejectAd(
  adId: number,
  moderatorUserId: string,
  rejectionData: {
    reasonCode: ModerationReasonCode;
    reasonText?: string;
  },
  moderatorRole: AuditActorRole = 'MODERATOR'
): Promise<RejectAdResult> {
  const auditContext = await getEnhancedAuditContext();

  try {
    await auditServerAction(
      Enum.AuditAction.AD_REJECT as AuditAction,
      Enum.AuditEntityType.AD as AuditEntityType,
      async () => {
        // Get the ad first
        const ad = await prisma.ad.findUnique({
          where: { id: adId },
          select: { id: true, userId: true, status: true, category: true },
        });

        if (!ad) {
          throw new Error('Ad not found');
        }

        if (ad.status !== 'PENDING') {
          throw new Error('Can only reject ads with PENDING status');
        }

        const prevStatus = ad.status;
        const nextStatus = 'REJECTED';

        // Use transaction for atomicity
        await prisma.$transaction(async (tx) => {
          // Update ad status
          await tx.ad.update({
            where: { id: adId },
            data: {
              status: nextStatus,
              updatedAt: new Date(),
            },
          });

          // Create moderation action record
          await tx.moderationAction.create({
            data: {
              actorUserId: moderatorUserId,
              adId: adId,
              targetType: 'AD',
              action: 'REJECT',
              reasonCode: rejectionData.reasonCode,
              reasonText: rejectionData.reasonText || null,
              prevStatus,
              nextStatus,
            },
          });
        });

        // Helper to humanize rejection codes
        const humanizeReasonCode = (code: ModerationReasonCode): string => {
          const codeNames: Record<string, string> = {
            OFF_TOPIC: 'Off Topic',
            WRONG_CATEGORY: 'Wrong Category',
            INCOMPLETE_DETAILS: 'Incomplete Details',
            SPAM: 'Spam',
            SCAM_FRAUD: 'Scam/Fraud',
            PROHIBITED_ITEM: 'Prohibited Item',
            DUPLICATE: 'Duplicate Ad',
            EXPIRED: 'Expired Content',
            OTHER: 'Other',
          };
          return codeNames[code] || code;
        };

        const reasonLabel = humanizeReasonCode(rejectionData.reasonCode);
        const notificationBody = rejectionData.reasonText
          ? `Reason: ${reasonLabel}. ${rejectionData.reasonText}`
          : `Reason: ${reasonLabel}`;

        // Send notification to ad owner (outside transaction)
        await createNotification({
          userId: ad.userId,
          type: 'AD_EVENT',
          severity: 'ERROR',
          title: 'Ad Rejected',
          body: notificationBody,
          adId: adId,
          deepLink: `/dashboard/ads-management/${adId}`,
          data: {
            category: ad.category,
            prevStatus,
            nextStatus,
            reasonCode: rejectionData.reasonCode,
          },
        });

        return { success: true };
      },
      {
        actorUserId: moderatorUserId,
        actorRole: moderatorRole,
        ...auditContext,
      },
      adId,
      'Moderator rejected ad'
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject ad';

    // Log failure
    await logFailure(
      Enum.AuditAction.AD_REJECT as AuditAction,
      Enum.AuditEntityType.AD as AuditEntityType,
      'REJECT_FAILED',
      {
        actorUserId: moderatorUserId,
        actorRole: moderatorRole,
        ...auditContext,
      },
      adId,
      { error: errorMessage, reasonCode: rejectionData.reasonCode },
      'Failed to reject ad'
    ).catch(console.error);

    return { success: false, error: errorMessage };
  }
}

/**
 * Bulk approve multiple ads
 */
export async function bulkApproveAds(
  adIds: number[],
  moderatorUserId: string,
  moderatorRole: AuditActorRole = 'MODERATOR'
): Promise<{ successful: number[]; failed: { id: number; error: string }[] }> {
  const auditContext = await getEnhancedAuditContext();
  const successful: number[] = [];
  const failed: { id: number; error: string }[] = [];

  for (const adId of adIds) {
    const result = await moderatorApproveAd(adId, moderatorUserId, moderatorRole);
    if (result.success) {
      successful.push(adId);
    } else {
      failed.push({ id: adId, error: result.error || 'Unknown error' });
    }
  }

  // Log bulk action summary
  await logSuccess(
    Enum.AuditAction.AD_APPROVE as AuditAction,
    Enum.AuditEntityType.AD as AuditEntityType,
    {
      actorUserId: moderatorUserId,
      actorRole: moderatorRole,
      ...auditContext,
    },
    undefined,
    {
      action: 'bulk_approve',
      adIds,
      successful: successful.length,
      failed: failed.length,
    },
    `Bulk approved ${successful.length} ads`
  ).catch(console.error);

  return { successful, failed };
}

// =============================================================================
// Moderator Status Change Function (Any Status)
// =============================================================================

export interface ChangeAdStatusResult {
  success: boolean;
  error?: string;
}

/**
 * Change an ad's status to any available status (moderator/admin action)
 * - Updates ad status to the specified status
 * - Creates a ModerationAction record
 * - Logs audit entry
 * - Sends notification to ad owner
 */
export async function moderatorChangeAdStatus(
  adId: number,
  newStatus: AdStatus,
  moderatorUserId: string,
  moderatorRole: AuditActorRole = 'MODERATOR',
  note?: string
): Promise<ChangeAdStatusResult> {
  const auditContext = await getEnhancedAuditContext();

  // Determine appropriate audit action based on status change
  const getAuditAction = (status: AdStatus): AuditAction => {
    switch (status) {
      case 'ONLINE':
        return Enum.AuditAction.AD_APPROVE as AuditAction;
      case 'REJECTED':
        return Enum.AuditAction.AD_REJECT as AuditAction;
      default:
        return Enum.AuditAction.AD_EDIT as AuditAction;
    }
  };

  // Determine appropriate moderation action type
  const getModerationActionType = (status: AdStatus): ModerationActionType => {
    switch (status) {
      case 'ONLINE':
        return 'APPROVE';
      case 'REJECTED':
        return 'REJECT';
      case 'EXPIRED':
        return 'EXPIRE';
      case 'PENDING':
        return 'RESTORE'; // Restoring to pending for re-review
      default:
        return 'REQUEST_CHANGES';
    }
  };

  // Determine notification severity based on status
  const getNotificationSeverity = (status: AdStatus): 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' => {
    switch (status) {
      case 'ONLINE':
        return 'SUCCESS';
      case 'REJECTED':
        return 'ERROR';
      case 'EXPIRED':
        return 'WARNING';
      case 'PENDING':
        return 'INFO';
      default:
        return 'INFO';
    }
  };

  // Get human-readable status name
  const getStatusDisplayName = (status: AdStatus): string => {
    const names: Record<string, string> = {
      PENDING: 'Pending Review',
      ONLINE: 'Online',
      REJECTED: 'Rejected',
      EXPIRED: 'Expired',
    };
    return names[status] || status;
  };

  try {
    const auditAction = getAuditAction(newStatus);

    await auditServerAction(
      auditAction,
      Enum.AuditEntityType.AD as AuditEntityType,
      async () => {
        // Get the ad first
        const ad = await prisma.ad.findUnique({
          where: { id: adId },
          select: { id: true, userId: true, status: true, category: true },
        });

        if (!ad) {
          throw new Error('Ad not found');
        }

        if (ad.status === newStatus) {
          throw new Error(`Ad is already in ${newStatus} status`);
        }

        const prevStatus = ad.status;
        const nextStatus = newStatus;

        // Use transaction for atomicity
        await prisma.$transaction(async (tx) => {
          // Update ad status
          await tx.ad.update({
            where: { id: adId },
            data: {
              status: nextStatus,
              updatedAt: new Date(),
            },
          });

          // Create moderation action record
          await tx.moderationAction.create({
            data: {
              actorUserId: moderatorUserId,
              adId: adId,
              targetType: 'AD',
              action: getModerationActionType(newStatus),
              reasonText: note || null,
              prevStatus,
              nextStatus,
            },
          });
        });

        // Build notification message
        const statusName = getStatusDisplayName(newStatus);
        let notificationBody = `Your ad status has been changed to: ${statusName}`;
        if (note) {
          notificationBody += `. Note: ${note}`;
        }

        // Send notification to ad owner (outside transaction)
        await createNotification({
          userId: ad.userId,
          type: 'AD_EVENT',
          severity: getNotificationSeverity(newStatus),
          title: 'Ad Status Changed',
          body: notificationBody,
          adId: adId,
          deepLink: `/dashboard/ads-management/${adId}`,
          data: { category: ad.category, prevStatus, nextStatus },
        });

        return { success: true };
      },
      {
        actorUserId: moderatorUserId,
        actorRole: moderatorRole,
        ...auditContext,
      },
      adId,
      `Moderator changed ad status to ${newStatus}`
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to change ad status';

    // Log failure
    await logFailure(
      getAuditAction(newStatus),
      Enum.AuditEntityType.AD as AuditEntityType,
      'STATUS_CHANGE_FAILED',
      {
        actorUserId: moderatorUserId,
        actorRole: moderatorRole,
        ...auditContext,
      },
      adId,
      { error: errorMessage, targetStatus: newStatus },
      'Failed to change ad status'
    ).catch(console.error);

    return { success: false, error: errorMessage };
  }
}

/**
 * Bulk reject multiple ads
 */
export async function bulkRejectAds(
  adIds: number[],
  moderatorUserId: string,
  rejectionData: {
    reasonCode: ModerationReasonCode;
    reasonText?: string;
  },
  moderatorRole: AuditActorRole = 'MODERATOR'
): Promise<{ successful: number[]; failed: { id: number; error: string }[] }> {
  const auditContext = await getEnhancedAuditContext();
  const successful: number[] = [];
  const failed: { id: number; error: string }[] = [];

  for (const adId of adIds) {
    const result = await moderatorRejectAd(adId, moderatorUserId, rejectionData, moderatorRole);
    if (result.success) {
      successful.push(adId);
    } else {
      failed.push({ id: adId, error: result.error || 'Unknown error' });
    }
  }

  // Log bulk action summary
  await logSuccess(
    Enum.AuditAction.AD_REJECT as AuditAction,
    Enum.AuditEntityType.AD as AuditEntityType,
    {
      actorUserId: moderatorUserId,
      actorRole: moderatorRole,
      ...auditContext,
    },
    undefined,
    {
      action: 'bulk_reject',
      adIds,
      successful: successful.length,
      failed: failed.length,
      reasonCode: rejectionData.reasonCode,
    },
    `Bulk rejected ${successful.length} ads`
  ).catch(console.error);

  return { successful, failed };
}
