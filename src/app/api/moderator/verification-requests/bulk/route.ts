import * as Enum from '@/generated/enums';
import type { VerificationRejectionCode } from '@/generated/prisma';
import { auth } from '@/lib/auth';
import {
  bulkApproveVerifications,
  bulkRejectVerifications,
} from '@/lib/dal/moderator-verification';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bulkApproveSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});

const bulkRejectSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  rejectionCode: z.nativeEnum(Enum.VerificationRejectionCode),
  rejectionNote: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!session.user.role || !['MODERATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    // Support both approve and reject via action field
    const action = body?.action as 'approve' | 'reject' | undefined;
    if (action === 'approve') {
      const { ids } = bulkApproveSchema.parse(body);
      const result = await bulkApproveVerifications(ids, session.user.id, session.user.role as any);
      return NextResponse.json({ success: true, data: result });
    } else if (action === 'reject') {
      const { ids, rejectionCode, rejectionNote } = bulkRejectSchema.parse(body);
      const result = await bulkRejectVerifications(
        ids,
        session.user.id,
        { rejectionCode: rejectionCode as VerificationRejectionCode, rejectionNote },
        session.user.role as any
      );
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Bulk moderation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
