import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

/**
 * Get session token for client-side use
 * This endpoint returns the session token so it can be sent as Authorization header
 * when Edge Tracking Prevention blocks cookies
 * 
 * Note: This endpoint reads cookies directly without requiring authentication
 * because cookies might not be sent in fetch requests due to Edge Tracking Prevention
 */
export async function GET(req: NextRequest) {
  try {
    // Get session token from cookies directly
    // Try all possible cookie names (production and development)
    const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                        req.cookies.get('__Secure-next-auth.session-token')?.value ||
                        req.cookies.get('__Host-next-auth.session-token')?.value ||
                        req.cookies.get('authjs.session-token')?.value ||
                        req.cookies.get('__Secure-authjs.session-token')?.value;

    if (!sessionToken) {
      // Log all cookies for debugging
      const allCookies = req.cookies.getAll();
      console.log("[auth/session-token] No session token found. Available cookies:", 
        allCookies.map(c => c.name));
      
      return NextResponse.json(
        { success: false, error: "No session token found" },
        { status: 401 }
      );
    }

    // Decode token to get user info (for response)
    try {
      const parts = sessionToken.split('.');
      if (parts.length === 3) {
        const payload = parts[1];
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        const decodedPayload = JSON.parse(
          atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'))
        );
        
        // Return token (client will use it as Authorization header)
        return NextResponse.json({
          success: true,
          token: sessionToken,
          user: {
            email: decodedPayload.email,
            name: decodedPayload.name,
          }
        });
      }
    } catch (decodeError) {
      console.error("[auth/session-token] Error decoding token:", decodeError);
    }

    // Return token even if decoding fails (token is still valid)
    return NextResponse.json({
      success: true,
      token: sessionToken,
    });
  } catch (error) {
    console.error("[auth/session-token] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
