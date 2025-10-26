import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'Accept-Language': 'en', 'User-Agent': 'ItaliaHub-Housing-App/1.0' } as const;

type MapBounds = { minLng: number; minLat: number; maxLng: number; maxLat: number };

type NominatimPlace = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  boundingbox?: string[];
  [k: string]: unknown;
};

function extractNeighborhood(address?: Record<string, string>) {
  if (!address) return '';
  return address.neighbourhood || address.suburb || address.town || address.village || '';
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: HEADERS });
  const txt = await res.text();
  if (!res.ok) {
    const snippet = txt ? `: ${txt.slice(0, 300)}` : '';
    throw new Error(`Nominatim ${res.status}${snippet}`);
  }
  try {
    return JSON.parse(txt);
  } catch (err) {
    throw new Error(`Invalid JSON from Nominatim${txt ? `: ${txt.slice(0, 200)}` : ''}`);
  }
}

function parseBoundsFromNominatim(bbox?: string[]): MapBounds | null {
  if (!bbox || bbox.length < 4) return null;
  // Nominatim returns [minlat, maxlat, minlon, maxlon]
  const minLat = parseFloat(bbox[0]);
  const maxLat = parseFloat(bbox[1]);
  const minLng = parseFloat(bbox[2]);
  const maxLng = parseFloat(bbox[3]);
  if ([minLat, maxLat, minLng, maxLng].some((v) => Number.isNaN(v))) return null;
  return { minLng, minLat, maxLng, maxLat };
}

function validateBounds(b: unknown): b is MapBounds {
  if (!b || typeof b !== 'object') return false;
  const bb = b as Record<string, unknown>;
  return [bb.minLat, bb.maxLat, bb.minLng, bb.maxLng].every(
    (v) => typeof v === 'number' && !Number.isNaN(v)
  );
}

async function handleCityBBox(cityName: unknown, countryCode = 'IT') {
  const city = String(cityName || '').trim();
  if (!city) return NextResponse.json({ error: 'Missing cityName' }, { status: 400 });

  const params = new URLSearchParams({
    city,
    countrycodes: String(countryCode).toUpperCase(),
    featureType: 'city',
    limit: '1',
    format: 'json',
  });

  const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
  try {
    const data = (await fetchJson(url)) as NominatimPlace[];
    if (!Array.isArray(data) || data.length === 0)
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    const place = data[0];
    const bounds = parseBoundsFromNominatim(place.boundingbox as string[] | undefined);
    if (!bounds)
      return NextResponse.json({ error: 'City bounding box missing or invalid' }, { status: 502 });
    return NextResponse.json({ bounds });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('City bbox fetch failed:', msg);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

function buildViewboxParams(bounds: MapBounds) {
  // viewbox expects west,south,east,north -> minLng,minLat,maxLng,maxLat
  const west = Math.min(bounds.minLng, bounds.maxLng);
  const east = Math.max(bounds.minLng, bounds.maxLng);
  const south = Math.min(bounds.minLat, bounds.maxLat);
  const north = Math.max(bounds.minLat, bounds.maxLat);
  return `${west},${south},${east},${north}`;
}

async function handleSearch(query: unknown, bounds: unknown, cityName: unknown) {
  const q = String(query || '').trim();
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  // Validate bounds if provided, but don't require them
  let validBounds: MapBounds | null = null;
  if (bounds !== undefined && bounds !== null) {
    if (!validateBounds(bounds)) {
      return NextResponse.json({ error: 'Invalid bounds format' }, { status: 400 });
    }
    validBounds = bounds as MapBounds;
  }

  const city = String(cityName || '').trim();
  const fullQuery = city ? `${q}, ${city}` : q;

  const params = new URLSearchParams({
    q: fullQuery,
    format: 'json',
    limit: '7',
    addressdetails: '1',
    countrycodes: 'it',
  });

  // Only add viewbox and bounded if bounds are provided
  if (validBounds) {
    params.append('viewbox', buildViewboxParams(validBounds));
    params.append('bounded', '1');
  }

  const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
  try {
    const data = await fetchJson(url);
    const arr = Array.isArray(data) ? (data as any[]) : [];
    const results = arr.map((r) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: r.display_name || '',
      neighborhood: extractNeighborhood(r.address),
    }));
    return NextResponse.json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Search failed:', msg);
    return NextResponse.json({ error: msg, results: [] }, { status: 503 });
  }
}

function isPointInBounds(lat: number, lng: number, bounds: MapBounds) {
  return (
    lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng
  );
}

async function handleReverse(lat: unknown, lng: unknown, bounds: unknown, cityName: unknown) {
  const latNum = parseFloat(String(lat || ''));
  const lngNum = parseFloat(String(lng || ''));
  if (Number.isNaN(latNum) || Number.isNaN(lngNum))
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });

  // Validate bounds if provided, but don't require them
  let validBounds: MapBounds | null = null;
  if (bounds !== undefined && bounds !== null) {
    if (!validateBounds(bounds)) {
      return NextResponse.json({ error: 'Invalid bounds format' }, { status: 400 });
    }
    validBounds = bounds as MapBounds;
  }

  // Check if point is in bounds if bounds are provided
  if (validBounds && !isPointInBounds(latNum, lngNum, validBounds)) {
    return NextResponse.json({ error: 'Point outside of city bounds' }, { status: 400 });
  }

  const params = new URLSearchParams({
    lat: String(latNum),
    lon: String(lngNum),
    format: 'json',
    addressdetails: '1',
    zoom: '18',
  });
  const url = `${NOMINATIM_BASE}/reverse?${params.toString()}`;
  try {
    const data = (await fetchJson(url)) as any;
    const neighborhood = extractNeighborhood(data.address);
    const city = String(cityName || '').trim();
    if (city) {
      const addr = data.address || {};
      const addressValues = Object.values(addr).map(String).join(' ').toLowerCase();
      if (!addressValues.includes(city.toLowerCase())) {
        return NextResponse.json({ neighborhood: '', displayName: data.display_name || '' });
      }
    }
    return NextResponse.json({ neighborhood, displayName: data.display_name || '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Reverse failed:', msg);
    return NextResponse.json({ error: msg, neighborhood: '' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = body.mode || 'search';
    if (mode === 'city_bbox') return handleCityBBox(body.cityName, body.countryCode || 'IT');
    if (mode === 'reverse') return handleReverse(body.lat, body.lng, body.bounds, body.cityName);
    return handleSearch(body.query, body.bounds, body.cityName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Request error:', msg);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
