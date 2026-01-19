/**
 * Helper function to fetch with automatic Authorization header
 * Works around Edge Tracking Prevention blocking cookies
 */

let cachedToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

/**
 * Get session token from API endpoint
 * Caches token to avoid repeated requests
 */
async function getSessionToken(): Promise<string | null> {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // Return existing promise if already fetching
  if (tokenPromise) {
    return tokenPromise;
  }

  // Fetch token from API
  tokenPromise = fetch('/api/auth/session-token', {
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        console.warn('[fetch-with-auth] Failed to get session token:', response.status);
        cachedToken = null;
        return null;
      }
      const data = await response.json();
      if (data.success && data.token) {
        cachedToken = data.token;
        return data.token;
      }
      cachedToken = null;
      return null;
    })
    .catch((error) => {
      console.error('[fetch-with-auth] Error fetching session token:', error);
      cachedToken = null;
      return null;
    })
    .finally(() => {
      // Clear promise after completion
      tokenPromise = null;
    });

  return tokenPromise;
}

/**
 * Clear cached token (call after logout)
 */
export function clearAuthToken() {
  cachedToken = null;
  tokenPromise = null;
}

/**
 * Fetch with automatic Authorization header
 * Falls back to cookies if Authorization header fails
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Try to get session token
  const token = await getSessionToken();
  
  // Prepare headers
  const headers = new Headers(options.headers);
  
  // Add Authorization header if token is available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Always include credentials for cookie fallback
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };
  
  return fetch(url, fetchOptions);
}
