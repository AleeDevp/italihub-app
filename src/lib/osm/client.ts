import type { LocationData, OSMBoundary, OSMReverseGeocode, OSMSearchResult } from './types';

const DEFAULT_TIMEOUT_MS = 10000;

async function doFetchJson<T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      // Try to parse error body
      let body: unknown = null;
      try {
        body = await res.json();
      } catch (_e) {
        // ignore
      }
      const msg =
        body && typeof body === 'object' && 'error' in (body as any)
          ? ((body as any).error as string)
          : `${res.status} ${res.statusText}`;
      const err = new Error(msg) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    // parse json
    try {
      return (await res.json()) as T;
    } catch (parseErr) {
      const err = new Error('Invalid JSON response from location service');
      throw err;
    }
  } catch (err: any) {
    if (err && err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    // network errors are TypeError in fetch
    if (err instanceof TypeError) {
      throw new Error('Network error communicating with location service');
    }
    throw err;
  }
}

export async function fetchCityBoundary(
  cityName: string,
  countryCode = 'IT'
): Promise<OSMBoundary> {
  if (!cityName) throw new Error('Missing city name');

  try {
    const proxyUrl = `/api/osm/boundary?q=${encodeURIComponent(cityName)}&countrycodes=${encodeURIComponent(
      countryCode
    )}`;
    const data = await doFetchJson<OSMBoundary>(proxyUrl, 12000);
    if (!data || !data.features) throw new Error('Invalid boundary data from proxy');
    return data;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    throw new Error(`Failed to load city boundary: ${e.message}`);
  }
}

export async function searchLocations(
  query: string,
  cityName: string,
  limit = 10
): Promise<OSMSearchResult[]> {
  if (!query || !query.trim()) return [];

  try {
    const proxyUrl = `/api/osm/search?q=${encodeURIComponent(query)}&city=${encodeURIComponent(
      cityName || ''
    )}&limit=${encodeURIComponent(String(limit))}`;
    const results = await doFetchJson<unknown>(proxyUrl, 7000);
    if (!Array.isArray(results)) throw new Error('Invalid search response');
    return results as OSMSearchResult[];
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    throw new Error(`Search failed: ${e.message}`);
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<LocationData> {
  if (typeof lat !== 'number' || typeof lng !== 'number') throw new Error('Invalid coordinates');

  try {
    const proxyUrl = `/api/osm/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const rev = await doFetchJson<OSMReverseGeocode>(proxyUrl, 8000);
    const address = rev.address || {};
    const neighborhood =
      address.neighbourhood ||
      address.suburb ||
      address.hamlet ||
      address.village ||
      address.town ||
      address.city ||
      'Unknown';
    // Return both the human readable display name and the parsed address object
    return {
      lat,
      lng,
      neighborhood,
      address: rev.display_name || undefined,
      addressObj: address,
    };
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    throw new Error(`Reverse geocoding failed: ${e.message}`);
  }
}
