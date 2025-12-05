import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callNominatim } from '../_lib/osm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const schema = z.object({
      lat: z
        .string()
        .transform((v) => Number(v))
        .refine((n) => Number.isFinite(n) && n >= -90 && n <= 90, 'lat must be -90..90'),
      lon: z
        .string()
        .transform((v) => Number(v))
        .refine((n) => Number.isFinite(n) && n >= -180 && n <= 180, 'lon must be -180..180'),
    });
    const parsed = schema.safeParse({
      lat: url.searchParams.get('lat'),
      lon: url.searchParams.get('lon'),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { lat, lon } = parsed.data;
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'json',
      zoom: '18',
      addressdetails: '1',
    });

    const data = await callNominatim(req, '/reverse', params, {
      timeoutMs: 8000,
      revalidateSeconds: 60,
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/osm/reverse error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
