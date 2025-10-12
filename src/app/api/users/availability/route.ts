import { isUserIdAvailable } from '@/data/user/user.dal';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const currentUserId = searchParams.get('currentUserId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const result = await isUserIdAvailable(userId, currentUserId || undefined);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store', // Results are user-specific and change over time
      },
    });
  } catch (error) {
    console.error('UserId availability check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
