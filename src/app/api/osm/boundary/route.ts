import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callNominatim } from '../_lib/osm';

// Simple in-memory cache. Keep small to avoid memory growth.
const boundaryCache = new Map<string, { ts: number; data: any }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const schema = z.object({
      q: z.string().min(1),
      countrycodes: z
        .string()
        .regex(/^[A-Za-z,]+$/, 'countrycodes must be ISO codes joined by comma')
        .optional()
        .default('IT'),
    });
    const parsed = schema.safeParse({
      q: url.searchParams.get('q'),
      countrycodes: url.searchParams.get('countrycodes') || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { q, countrycodes } = parsed.data;

    const cacheKey = `${q}::${countrycodes}`;
    const cached = boundaryCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const params = new URLSearchParams({
      q,
      format: 'geojson',
      countrycodes,
      limit: '1',
      polygon_geojson: '1',
      zoom: '12',
    });

    const data = await callNominatim(req, '/search', params, {
      timeoutMs: 12000,
      revalidateSeconds: 3600,
    });
    boundaryCache.set(cacheKey, { ts: Date.now(), data });
    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/osm/boundary error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
