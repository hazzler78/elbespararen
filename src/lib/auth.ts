import { NextRequest } from "next/server";

/**
 * Get session user from request cookies in Edge runtime
 * Manually decodes JWT token from NextAuth session cookie
 * Note: This doesn't verify the signature, but checks expiration
 */
export async function getSessionUser(req: NextRequest) {
  try {
    // Get session token from cookies
    // NextAuth uses different cookie names in production vs development
    const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                        req.cookies.get('__Secure-next-auth.session-token')?.value ||
                        req.cookies.get('__Host-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      console.log("[auth] No session token found in cookies");
      return null;
    }

    // Decode JWT token (base64url encoded)
    try {
      const parts = sessionToken.split('.');
      if (parts.length !== 3) {
        console.log("[auth] Invalid session token format");
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decodedPayload = JSON.parse(
        atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'))
      );

      // Check if token is expired
      if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
        console.log("[auth] Session token expired");
        return null;
      }

      // Return user info from token
      // NextAuth stores email in the token
      if (!decodedPayload.email) {
        console.log("[auth] No email in session token");
        return null;
      }

      return {
        id: decodedPayload.sub || decodedPayload.id || decodedPayload.email,
        email: decodedPayload.email as string,
        name: decodedPayload.name as string | undefined,
        image: decodedPayload.picture as string | undefined,
      };
    } catch (decodeError) {
      console.error("[auth] Error decoding session token:", decodeError);
      return null;
    }
  } catch (error) {
    console.error("[auth] Error getting session user:", error);
    // Return null instead of throwing - allows routes to continue without auth
    return null;
  }
}
