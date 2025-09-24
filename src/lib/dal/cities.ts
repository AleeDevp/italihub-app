import { prisma } from '@/lib/db';

export async function listCities(): Promise<Array<{ id: number; name: string }>> {
  const cities = await prisma.city.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return cities;
}
