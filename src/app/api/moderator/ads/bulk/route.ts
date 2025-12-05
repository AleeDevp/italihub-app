/**
 * API Route: /api/moderator/ads/bulk
 *
 * Handles bulk approve/reject operations for ads.
 */

import { bulkApproveAds, bulkRejectAds } from '@/data/moderator/ad-moderation.dal';
import * as Enum from '@/generated/enums';
import type { AuditActorRole, ModerationReasonCode } from '@/generated/prisma';
import { getServerSession } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for bulk operations
const bulkOperationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    ids: z.array(z.number().int().positive()).min(1).max(50),
  }),
  z.object({
    action: z.literal('reject'),
    ids: z.array(z.number().int().positive()).min(1).max(50),
    reasonCode: z.nativeEnum(Enum.ModerationReasonCode),
    reasonText: z.string().optional(),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has moderator or admin role
    if (!session.user.role || !['MODERATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate body
    const body = await request.json();
    const validationResult = bulkOperationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const moderatorRole = session.user.role as AuditActorRole;

    if (data.action === 'approve') {
      const result = await bulkApproveAds(data.ids, session.user.id, moderatorRole);

      return NextResponse.json({
        success: true,
        data: result,
        message: `Approved ${result.successful.length} ad(s)${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`,
      });
    } else if (data.action === 'reject') {
      const result = await bulkRejectAds(
        data.ids,
        session.user.id,
        {
          reasonCode: data.reasonCode as ModerationReasonCode,
          reasonText: data.reasonText,
        },
        moderatorRole
      );

      return NextResponse.json({
        success: true,
        data: result,
        message: `Rejected ${result.successful.length} ad(s)${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing bulk ad moderation:', error);
    return NextResponse.json(
      {
        error: 'Failed to process bulk operation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
