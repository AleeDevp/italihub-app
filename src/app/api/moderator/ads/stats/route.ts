/**
 * API Route: /api/moderator/ads/stats
 *
 * Returns statistics for ad moderation dashboard.
 */

import { getAdModerationStats } from '@/data/moderator/ad-moderation.dal';
import { getServerSession } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const stats = await getAdModerationStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching ad moderation stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
