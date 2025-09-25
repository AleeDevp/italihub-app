import { prisma } from '@/lib/db';
import type { City } from '@/types/city';

// Adjust if you want a different TTL (ms). With “rarely changes”, you can bump to 12h.
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

type State = {
  data: City[] | null;
  loadedAt: number;
  ttlMs: number;
};

const g = globalThis as any;
g.__CITY_CACHE__ ||= { data: null, loadedAt: 0, ttlMs: DEFAULT_TTL_MS } as State;
const state: State = g.__CITY_CACHE__;

// Prisma → client-safe City
function toClientCity(row: any): City {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    region: row.region ?? null,
    province: row.province ?? null,
    provinceCode: row.provinceCode ?? null,
    lat: row.lat !== null && row.lat !== undefined ? Number(row.lat) : null,
    lng: row.lng !== null && row.lng !== undefined ? Number(row.lng) : null,
    altNames: row.altNames ?? [],
    isActive: row.isActive,
    sortOrder: row.sortOrder ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function loadFromDB(): Promise<City[]> {
  const rows = await prisma.city.findMany({
    where: { isActive: true }, // serve only active cities to UI
    select: {
      id: true,
      name: true,
      slug: true,
      region: true,
      province: true,
      provinceCode: true,
      lat: true,
      lng: true,
      altNames: true,
      isActive: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return rows.map(toClientCity);
}

export async function getAllCities(): Promise<City[]> {
  const now = Date.now();
  if (!state.data || now - state.loadedAt > state.ttlMs) {
    state.data = await loadFromDB();
    state.loadedAt = now;
  }
  return state.data!;
}

export async function getCityById(id: number): Promise<City | null> {
  return state.data?.filter((c) => c.id === id)[0] ?? null;
}

// If you ever mutate City (admin UI), call this after writes.
export async function refreshCities() {
  state.data = await loadFromDB();
  state.loadedAt = Date.now();
}

// Optional: change TTL at runtime
export function setCityCacheTTL(ms: number) {
  state.ttlMs = ms;
}
