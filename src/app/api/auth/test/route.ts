// Test endpoint to verify NextAuth configuration
// Access: https://elbespararen.se/api/auth/test
export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth-config";

export async function GET(req: NextRequest) {
  try {
    // Try to get auth handlers
    const authHandlers = handlers;
    
    // Create a test request to the signin endpoint
    const testUrl = new URL("/api/auth/signin/google", req.url);
    const testReq = new NextRequest(testUrl, {
      method: 'GET',
      headers: {
        ...Object.fromEntries(req.headers.entries()),
        'host': new URL(req.url).host,
      },
    });
    
    // Try to call the handler
    const response = await authHandlers.GET(testReq);
    
    // Clone response to read body without consuming it
    const responseClone = response.clone();
    const responseText = await responseClone.text().catch(() => '');
    
    const location = response.headers.get('location');
    const isErrorRedirect = location?.includes('/auth/error');
    
    return NextResponse.json({
      success: !isErrorRedirect,
      message: isErrorRedirect 
        ? "NextAuth redirected to error route - configuration issue detected"
        : response.status === 302 || response.status === 307
        ? "NextAuth redirected (this is normal for sign-in - should redirect to Google OAuth)"
        : "NextAuth returned a non-redirect response",
      testResponse: {
        status: response.status,
        statusText: response.statusText,
        redirectsTo: location || 'none',
        isErrorRedirect,
        headers: Object.fromEntries(response.headers.entries()),
        bodyPreview: responseText.substring(0, 200),
      },
      diagnosis: isErrorRedirect
        ? "NextAuth detected a configuration error during sign-in flow. This is likely a NextAuth v5 beta Edge runtime compatibility issue since initialization succeeds but request handling fails."
        : response.status === 302 || response.status === 307
        ? "NextAuth is working correctly - it should redirect to Google OAuth"
        : "Unexpected response - check NextAuth configuration",
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      stack: error?.stack,
      note: "Error occurred while testing NextAuth handlers",
    }, { status: 500 });
  }
}
