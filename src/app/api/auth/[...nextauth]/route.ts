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
  return handlers.GET(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handlers.POST(req, context);
}
