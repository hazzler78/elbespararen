/**
 * Cloudflare Web Analytics (RUM) — cookieless, loads via beacon.min.js.
 * The site token is public (embedded in client HTML). Env override is optional.
 */

/** elbespararen.se Web Analytics token (from live site / CF dashboard). */
export const CF_WEB_ANALYTICS_DEFAULT_TOKEN =
  'ce91b174578341a796b4ce458130492d';

const PLACEHOLDER_TOKENS = new Set([
  'your_cloudflare_web_analytics_token',
  'YOUR_TOKEN',
  '',
]);

function resolveWebAnalyticsToken(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN?.trim();
  if (fromEnv && !PLACEHOLDER_TOKENS.has(fromEnv)) {
    return fromEnv;
  }
  return CF_WEB_ANALYTICS_DEFAULT_TOKEN;
}

/** Serialized `data-cf-beacon` attribute (SPA route tracking enabled). */
export function getCloudflareBeaconConfig(): string {
  return JSON.stringify({
    token: resolveWebAnalyticsToken(),
    spa: true,
  });
}
