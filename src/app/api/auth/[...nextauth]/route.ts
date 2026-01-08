// Cloudflare Pages requires Edge runtime for all routes
// Note: NextAuth.js v5 beta may have issues with Edge runtime, but required for Cloudflare
export const runtime = 'edge';

import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth-config";

// Export GET and POST handlers for Next.js App Router
// NextAuth v5 beta expects route segments to be passed in context
// Next.js App Router passes NextRequest, not Request
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  // Await params and pass to handlers
  const params = await context.params;
  // Extract route segments from pathname for NextAuth v5 beta
  // Pathname: /api/auth/signin/google -> segments: ['signin', 'google']
  const pathname = req.nextUrl.pathname;
  const segments = pathname.replace('/api/auth/', '').split('/').filter(Boolean);
  console.log(`[nextauth-route] Pathname: ${pathname}, Segments: ${segments.join(',')}, Params: ${JSON.stringify(params)}`);
  return handlers.GET(req, { ...context, params: { nextauth: segments } });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  // Await params and pass to handlers
  const params = await context.params;
  // Extract route segments from pathname for NextAuth v5 beta
  // Pathname: /api/auth/signin/google -> segments: ['signin', 'google']
  const pathname = req.nextUrl.pathname;
  const segments = pathname.replace('/api/auth/', '').split('/').filter(Boolean);
  console.log(`[nextauth-route] POST Pathname: ${pathname}, Segments: ${segments.join(',')}, Params: ${JSON.stringify(params)}`);
  return handlers.POST(req, { ...context, params: { nextauth: segments } });
}
