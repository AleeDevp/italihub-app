/**
 * Create a short, human-friendly label from a full User-Agent string.
 * Examples:
 * - "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ..." -> "Windows x64"
 * - "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ..." -> "macOS"
 * - "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ..." -> "iOS (iPhone)"
 * - "Mozilla/5.0 (Linux; Android 14; Pixel 7) ..." -> "Android"
 */
export function formatUserAgentShort(ua?: string | null): string {
  if (!ua || typeof ua !== 'string') return 'Unknown device';

  const uaLower = ua.toLowerCase();

  // Bots / crawlers
  if (/(bot|crawler|spider)/.test(uaLower)) return 'Bot';

  // iOS devices
  if (/iphone/.test(uaLower)) return 'iOS (iPhone)';
  if (/ipad/.test(uaLower)) return 'iOS (iPad)';
  if (/ipod/.test(uaLower)) return 'iOS (iPod)';
  if (/cpu (?:iphone )?os \d+_\d+/i.test(ua)) return 'iOS';

  // Android
  if (/android/.test(uaLower)) return 'Android';

  // ChromeOS
  if (/cros/.test(uaLower)) return 'ChromeOS';

  // macOS (Macintosh; Intel Mac OS X ...)
  if (/macintosh|mac os x/.test(uaLower)) return 'macOS';

  // Windows - try to surface architecture if present
  if (/windows/.test(uaLower)) {
    const isArm = /arm|aarch64/.test(uaLower);
    const isX64 = /x64|wow64|win64/.test(uaLower);
    if (isX64) return 'Windows x64';
    if (isArm) return 'Windows ARM';
    return 'Windows';
  }

  // Linux (not Android)
  if (/linux/.test(uaLower)) return 'Linux';

  // Fallback minimal label (try to keep it short)
  return 'Unknown device';
}
