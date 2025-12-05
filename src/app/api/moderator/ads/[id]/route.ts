/**
 * API Route: /api/moderator/ads/[id]
 *
 * GET: Fetch detailed ad information for review
 * PATCH: Approve, reject, or change ad status
 */

import {
  getAdForModerationById,
  moderatorApproveAd,
  moderatorChangeAdStatus,
  moderatorRejectAd,
} from '@/data/moderator/ad-moderation.dal';
import * as Enum from '@/generated/enums';
import type { AdStatus, AuditActorRole, ModerationReasonCode } from '@/generated/prisma';
import { getServerSession } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for PATCH body
const patchBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    note: z.string().optional(),
  }),
  z.object({
    action: z.literal('reject'),
    reasonCode: z.nativeEnum(Enum.ModerationReasonCode),
    reasonText: z.string().optional(),
  }),
  z.object({
    action: z.literal('change-status'),
    newStatus: z.nativeEnum(Enum.AdStatus),
    note: z.string().optional(),
  }),
]);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const adId = parseInt(id, 10);

    if (isNaN(adId)) {
      return NextResponse.json({ error: 'Invalid ad ID' }, { status: 400 });
    }

    const ad = await getAdForModerationById(adId);

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error('Error fetching ad for moderation:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ad',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const adId = parseInt(id, 10);

    if (isNaN(adId)) {
      return NextResponse.json({ error: 'Invalid ad ID' }, { status: 400 });
    }

    // Parse and validate body
    const body = await request.json();
    const validationResult = patchBodySchema.safeParse(body);

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
      const result = await moderatorApproveAd(adId, session.user.id, moderatorRole, data.note);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Ad approved successfully',
      });
    } else if (data.action === 'reject') {
      const result = await moderatorRejectAd(
        adId,
        session.user.id,
        {
          reasonCode: data.reasonCode as ModerationReasonCode,
          reasonText: data.reasonText,
        },
        moderatorRole
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Ad rejected successfully',
      });
    } else if (data.action === 'change-status') {
      const result = await moderatorChangeAdStatus(
        adId,
        data.newStatus as AdStatus,
        session.user.id,
        moderatorRole,
        data.note
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `Ad status changed to ${data.newStatus} successfully`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing ad moderation action:', error);
    return NextResponse.json(
      {
        error: 'Failed to process moderation action',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
