// Cloudflare Pages requires Edge runtime for all routes
// Note: NextAuth.js v5 beta may have issues with Edge runtime, but required for Cloudflare
export const runtime = 'edge';

import { handlers } from "@/lib/auth-config";

// Export GET and POST handlers for Next.js App Router
// NextAuth v5 beta expects route segments to be passed in context
export async function GET(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handlers.GET(req as any, context);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handlers.POST(req as any, context);
}
