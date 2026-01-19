import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth-config";

/**
 * Get session user from request cookies
 * Works in both Node.js and Edge runtime by manually decoding JWT token
 * Falls back to NextAuth's getServerSession if available
 */
export async function getSessionUser(req: NextRequest) {
  // Try NextAuth's getServerSession first (if available and working)
  try {
    if (getServerSession) {
      const session = await getServerSession();
      if (session?.user?.email) {
        console.log("[auth] Using NextAuth getServerSession, user:", session.user.email);
        return {
          id: (session.user as any).id || session.user.email,
          email: session.user.email,
          name: session.user.name || undefined,
          image: session.user.image || undefined,
        };
      }
    }
  } catch (error) {
    // Fall back to manual decoding if getServerSession fails
    console.log("[auth] getServerSession failed, falling back to manual decoding:", error);
  }
  try {
    // Get session token from Authorization header first (for Edge Tracking Prevention workaround)
    const authHeader = req.headers.get('authorization');
    let sessionToken: string | undefined;
    let isAuthHeader = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if this is a simple auth token (workaround for Edge Tracking Prevention)
      try {
        const decoded = JSON.parse(atob(token));
        if (decoded.email && decoded.timestamp) {
          // This is a simple auth token created from session data
          // Validate by checking if user exists in database
          console.log("[auth] Found simple auth token in Authorization header, email:", decoded.email);
          
          // Get database to validate user
          let env: any = {};
          if ((globalThis as any).getRequestContext) {
            env = (globalThis as any).getRequestContext()?.env ?? {};
          }
          if (!env.DB && (process.env as any).DB) {
            env.DB = (process.env as any).DB;
          }
          if (!env.DB && (globalThis as any).env?.DB) {
            env.DB = (globalThis as any).env.DB;
          }
          
          const { createDatabaseFromBinding } = await import("@/lib/database");
          const db = createDatabaseFromBinding(env?.DB);
          const user = await db.getUserByEmail(decoded.email);
          
          if (user) {
            // Token is valid, return user
            console.log("[auth] Simple auth token validated, returning user:", decoded.email);
            return {
              id: user.id,
              email: user.email,
              name: user.name || undefined,
              image: user.image || undefined,
            };
          } else {
            console.log("[auth] Simple auth token validation failed - user not found:", decoded.email);
            return null;
          }
        }
      } catch (e) {
        // Not a simple auth token, treat as session token
        sessionToken = token;
        isAuthHeader = true;
        console.log("[auth] Found session token in Authorization header");
      }
    }
    
    if (!sessionToken) {
      // Fall back to cookies
      const allCookies = req.cookies.getAll();
      console.log("[auth] All cookies:", allCookies.map(c => c.name));
      
      sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                      req.cookies.get('__Secure-next-auth.session-token')?.value ||
                      req.cookies.get('__Host-next-auth.session-token')?.value ||
                      req.cookies.get('authjs.session-token')?.value ||
                      req.cookies.get('__Secure-authjs.session-token')?.value;
    }
    
    if (!sessionToken) {
      console.log("[auth] No session token found in cookies or Authorization header");
      return null;
    }
    
    console.log("[auth] Found session token, length:", sessionToken.length);

    // Decode JWT token (base64url encoded)
    try {
      const parts = sessionToken.split('.');
      if (parts.length !== 3) {
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
        return null;
      }

      // Return user info from token
      // NextAuth stores email in the token
      console.log("[auth] Decoded token payload:", { 
        sub: decodedPayload.sub, 
        id: decodedPayload.id, 
        email: decodedPayload.email,
        name: decodedPayload.name,
        exp: decodedPayload.exp,
        iat: decodedPayload.iat
      });
      
      if (!decodedPayload.email) {
        console.error("[auth] Token missing email field!");
        return null;
      }

      const user = {
        id: decodedPayload.sub || decodedPayload.id || decodedPayload.email,
        email: decodedPayload.email as string,
        name: decodedPayload.name as string | undefined,
        image: decodedPayload.picture as string | undefined,
      };
      
      console.log("[auth] Returning user:", { id: user.id, email: user.email });
      return user;
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
