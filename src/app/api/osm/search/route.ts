import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callNominatim } from '../_lib/osm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const schema = z.object({
      q: z.string().min(1),
      city: z.string().optional().default(''),
      limit: z
        .string()
        .transform((v) => parseInt(v || '10', 10))
        .refine((n) => Number.isFinite(n) && n >= 1 && n <= 10, 'limit must be 1..10')
        .optional()
        .default('10' as unknown as any),
    });

    const parsed = schema.safeParse({
      q: url.searchParams.get('q'),
      city: url.searchParams.get('city') || undefined,
      limit: url.searchParams.get('limit') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { q, city } = parsed.data as unknown as { q: string; city: string; limit: any };
    const limitVal = Math.min(
      10,
      Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10)
    );

    const params = new URLSearchParams({
      q: city ? `${q}, ${city}` : q,
      format: 'json',
      limit: String(limitVal),
      countrycodes: 'IT',
      addressdetails: '1',
      zoom: '18',
    });

    const data = await callNominatim(req, '/search', params, {
      timeoutMs: 8000,
      revalidateSeconds: 60, // short cache to be polite to OSM while keeping results fresh
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/osm/search error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
