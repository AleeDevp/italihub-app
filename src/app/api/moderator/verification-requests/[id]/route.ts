/**
 * API Route: /api/moderator/verification-requests/[id]
 *
 * Handles individual verification request operations:
 * - GET: Fetch detailed verification request
 * - PATCH: Approve/Reject verification request
 */

import {
  getVerificationRequestById,
  moderatorApproveVerification,
  moderatorRejectVerification,
} from '@/data/moderator/verification.dal';
import * as Enum from '@/generated/enums';
import type { VerificationRejectionCode } from '@/generated/prisma';
import { getServerSession } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for approval/rejection
const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionCode: z.nativeEnum(Enum.VerificationRejectionCode).optional(),
  rejectionNote: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    // Check authentication and authorization
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has moderator or admin role
    if (!session.user.role || !['MODERATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch verification request details
    const verificationRequest = await getVerificationRequestById(
      requestId,
      session.user.id,
      session.user.role as any
    );

    if (!verificationRequest) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...verificationRequest,
      },
    });
  } catch (error) {
    console.error('Error fetching verification request:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    // Check authentication and authorization
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has moderator or admin role
    if (!session.user.role || !['MODERATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { action, rejectionCode, rejectionNote } = actionSchema.parse(body);

    // Perform the action
    if (action === 'approve') {
      await moderatorApproveVerification(requestId, session.user.id, session.user.role as any);

      return NextResponse.json({
        success: true,
        message: 'Verification request approved successfully',
        data: { action: 'approved' },
      });
    } else if (action === 'reject') {
      if (!rejectionCode) {
        return NextResponse.json(
          { error: 'Rejection code is required for rejection' },
          { status: 400 }
        );
      }

      await moderatorRejectVerification(
        requestId,
        session.user.id,
        {
          rejectionCode: rejectionCode as VerificationRejectionCode,
          rejectionNote,
        },
        session.user.role as any
      );

      return NextResponse.json({
        success: true,
        message: 'Verification request rejected successfully',
        data: {
          action: 'rejected',
          rejectionCode,
          rejectionNote,
        },
      });
    }
  } catch (error) {
    console.error('Error processing verification request action:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Check for specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
      }

      if (error.message.includes('already') || error.message.includes('only')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
