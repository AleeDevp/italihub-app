const DEFAULT_TIMEOUT_MS = 10000;
const OSM_BASE_URL = 'https://nominatim.openstreetmap.org';

function getUserAgent() {
  // Respect Nominatim policy: allow configuring a UA via env
  return process.env.USER_AGENT || 'italihub-app/1.0';
}

function pickAcceptLanguage(req: Request): string {
  const hdr = req.headers.get('accept-language') || '';
  // Only allow a small safe subset to avoid long header passthrough
  if (/\bit\b/i.test(hdr)) return 'it';
  return 'en-US';
}

export async function fetchJsonWithTimeout(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  init?: RequestInit
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(text || `${res.status} ${res.statusText}`) as Error & {
        status?: number;
      };
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } catch (err: any) {
    clearTimeout(id);
    if (err?.name === 'AbortError') throw new Error('Upstream timeout');
    throw err;
  }
}

export async function callNominatim(
  req: Request,
  path: string,
  params: URLSearchParams,
  options?: { timeoutMs?: number; revalidateSeconds?: number }
) {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const revalidate = options?.revalidateSeconds;
  const url = `${OSM_BASE_URL}${path}?${params.toString()}`;
  const acceptLang = pickAcceptLanguage(req);
  const headers: HeadersInit = {
    'Accept-Language': acceptLang,
    'User-Agent': getUserAgent(),
  };
  return await fetchJsonWithTimeout(url, timeoutMs, {
    headers,
    // Let Next.js cache if configured
    next: revalidate ? { revalidate } : undefined,
  });
}
