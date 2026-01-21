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
function createAuthToken(session: { user?: { email?: string | null; id?: string } } | null): string | null {
  if (!session?.user?.email) {
    console.warn("[fetchWithAuth] Cannot create token - session missing email:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email
    });
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
  const token = btoa(JSON.stringify(tokenData));
  console.log("[fetchWithAuth] Created auth token for:", session.user.email);
  return token;
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
  session?: { user?: { email?: string | null; id?: string } } | null
): Promise<Response> {
  // Prepare headers
  const headers = new Headers(options.headers);
  
  // Create auth token from session if available
  if (session) {
    const token = createAuthToken(session);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log("[fetchWithAuth] Added Authorization header to request:", url);
    } else {
      console.warn("[fetchWithAuth] No token created, will rely on cookies for:", url);
    }
  } else {
    console.warn("[fetchWithAuth] No session provided for:", url);
  }
  
  // Always include credentials for cookie fallback
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };
  
  const response = await fetch(url, fetchOptions);
  
  // Log auth failures for debugging
  if (response.status === 401) {
    console.error("[fetchWithAuth] 401 Unauthorized for:", url, {
      hasSession: !!session,
      hasEmail: !!session?.user?.email,
      headersSent: headers.has('Authorization')
    });
  }
  
  return response;
}
