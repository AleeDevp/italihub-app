import { refreshCities } from '@/lib/cache/city-cache';
import { prisma } from '@/lib/db';

export async function updateCity(
  id: number,
  data: {
    name?: string;
    slug?: string;
    region?: string | null;
    province?: string | null;
    provinceCode?: string | null;
    lat?: number | null;
    lng?: number | null;
    altNames?: string[];
    isActive?: boolean;
    sortOrder?: number | null;
  }
) {
  const city = await prisma.city.update({
    where: { id },
    data,
  });
  await refreshCities();
  return city;
}
