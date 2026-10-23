/**
 * Preserve UTM query params across in-app navigation so analytics (CF / GA)
 * still attribute newsletter and social traffic after the first landing page.
 */

export const UTM_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

const STORAGE_KEY = 'elbespararen_utm_v1';

export function readStoredUtm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function storeUtmFromUrl(url: URL): void {
  const stored = readStoredUtm();
  let changed = false;
  for (const key of UTM_PARAM_KEYS) {
    const value = url.searchParams.get(key);
    if (value) {
      stored[key] = value;
      changed = true;
    }
  }
  if (changed) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // sessionStorage unavailable (private mode, etc.)
    }
  }
}

/** Add stored UTM params to `url` when they are not already present. */
export function mergeStoredUtmIntoUrl(url: URL): URL {
  const stored = readStoredUtm();
  const merged = new URL(url.toString());
  for (const [key, value] of Object.entries(stored)) {
    if (!merged.searchParams.has(key)) {
      merged.searchParams.set(key, value);
    }
  }
  return merged;
}
