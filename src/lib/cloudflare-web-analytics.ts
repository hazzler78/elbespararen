/**
 * Cloudflare Web Analytics (RUM) — cookieless, loads via beacon.min.js.
 * Token: Cloudflare Dashboard → Web Analytics → your site → Manage → JS snippet.
 */

export const CF_WEB_ANALYTICS_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN?.trim() || undefined;

const PLACEHOLDER_TOKENS = new Set([
  'your_cloudflare_web_analytics_token',
  'YOUR_TOKEN',
  '',
]);

export function isCloudflareWebAnalyticsConfigured(): boolean {
  if (!CF_WEB_ANALYTICS_TOKEN) return false;
  return !PLACEHOLDER_TOKENS.has(CF_WEB_ANALYTICS_TOKEN);
}

/** Serialized `data-cf-beacon` attribute (SPA route tracking enabled). */
export function getCloudflareBeaconConfig(): string | null {
  if (!isCloudflareWebAnalyticsConfigured() || !CF_WEB_ANALYTICS_TOKEN) {
    return null;
  }
  return JSON.stringify({
    token: CF_WEB_ANALYTICS_TOKEN,
    spa: true,
  });
}
