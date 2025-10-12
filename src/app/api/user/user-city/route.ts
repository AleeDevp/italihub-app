import { requireUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireUser();

    // Resolve city name if possible
    let cityName: string | null = null;
    const cityIdRaw = (user as any).cityId as string | number | null | undefined;
    const cityId = cityIdRaw != null ? Number(cityIdRaw) : NaN;
    if (!Number.isNaN(cityId)) {
      const city = await prisma.city.findUnique({ where: { id: cityId } });
      cityName = city?.name ?? null;
    }

    return NextResponse.json({ cityName });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
