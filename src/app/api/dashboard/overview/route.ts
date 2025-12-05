import { getOverviewSnapshot } from '@/data/dashboard/overview';
import { requireUser } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireUser();
    const snapshot = await getOverviewSnapshot(user.id);

    return NextResponse.json({
      stats: snapshot.adStats,
      topAds: snapshot.topAds,
      recentActivity: snapshot.recentActivity.map((activity) => ({
        ...activity,
        createdAt: activity.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching overview snapshot:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch overview data' }, { status: 500 });
  }
}
