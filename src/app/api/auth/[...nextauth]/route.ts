// Note: NextAuth.js v5 beta has issues with Edge runtime
// Using Node.js runtime instead for auth routes
// export const runtime = 'edge'; // Disabled due to compatibility issues

import { handlers } from "@/lib/auth-config";

// Export GET and POST handlers for Next.js App Router
// TypeScript requires explicit function exports for route handlers
export const GET = handlers.GET;
export const POST = handlers.POST;
