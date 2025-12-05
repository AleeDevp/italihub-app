import { getUserAdsWithDetails } from '@/data/ads/ads';
import type { AdCategory, AdStatus } from '@/generated/prisma';
import { requireUser } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';

const AD_STATUS_VALUES: AdStatus[] = ['PENDING', 'ONLINE', 'REJECTED', 'EXPIRED'];

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as AdCategory | null;
    const statusParam = searchParams.get('status');
    const status = AD_STATUS_VALUES.includes(statusParam as AdStatus)
      ? (statusParam as AdStatus)
      : undefined;

    const ads = await getUserAdsWithDetails(user.id, category || undefined, status);

    return NextResponse.json({ ads });
  } catch (error) {
    console.error('Error fetching user ads:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}
