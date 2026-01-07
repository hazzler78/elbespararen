// Cloudflare Pages requires Edge runtime for all routes
// Note: NextAuth.js v5 beta may have issues with Edge runtime, but required for Cloudflare
export const runtime = 'edge';

import { handlers } from "@/lib/auth-config";

// Export GET and POST handlers for Next.js App Router
// TypeScript requires explicit function exports for route handlers
export const GET = handlers.GET;
export const POST = handlers.POST;
