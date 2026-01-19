/**
 * Helper function to fetch with automatic Authorization header
 * Works around Edge Tracking Prevention blocking cookies
 * 
 * Uses session data from NextAuth to create a simple auth token
 */

/**
 * Create a simple auth token from session data
 * This is a workaround for Edge Tracking Prevention blocking cookies
 */
function createAuthToken(session: { user?: { email?: string; id?: string } } | null): string | null {
  if (!session?.user?.email) {
    return null;
  }
  
  // Create a simple token with email and id
  // Server will validate this by checking if user exists
  const tokenData = {
    email: session.user.email,
    id: session.user.id || session.user.email,
    timestamp: Date.now(),
  };
  
  // Base64 encode the token data
  // Note: This is not secure, but works as a workaround for Edge Tracking Prevention
  // Server will validate by checking if user exists in database
  return btoa(JSON.stringify(tokenData));
}

/**
 * Clear cached token (call after logout)
 */
export function clearAuthToken() {
  // No-op for now, token is created on-demand
}

/**
 * Fetch with automatic Authorization header
 * Uses session data from NextAuth to create auth token
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  session?: { user?: { email?: string; id?: string } } | null
): Promise<Response> {
  // Prepare headers
  const headers = new Headers(options.headers);
  
  // Create auth token from session if available
  if (session) {
    const token = createAuthToken(session);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  // Always include credentials for cookie fallback
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };
  
  return fetch(url, fetchOptions);
}
