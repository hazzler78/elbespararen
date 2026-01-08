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
      headers: req.headers,
    });
    
    // Try to call the handler
    const response = await authHandlers.GET(testReq);
    
    return NextResponse.json({
      success: true,
      message: "NextAuth handlers are working",
      testResponse: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        redirectsTo: response.headers.get('location') || 'none',
      },
      note: response.status === 302 || response.status === 307 
        ? "NextAuth redirected (this is normal for sign-in)"
        : "NextAuth returned a non-redirect response",
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      stack: error?.stack,
    }, { status: 500 });
  }
}
