import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createDatabaseFromBinding } from "@/lib/database";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Helper function to check for missing environment variables
function getMissingEnvVars(): string[] {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!process.env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET");
  return missing;
}

// Helper function to create configuration error response
function createConfigErrorResponse(req: NextRequest): Response {
  const missingVars = getMissingEnvVars();
  const isErrorRoute = req.nextUrl.pathname.includes("/auth/error");
  
  if (isErrorRoute) {
    // Return JSON for API error route
    return NextResponse.json(
      {
        error: "Configuration Error",
        message: "NextAuth is missing required environment variables",
        missingVariables: missingVars,
        help: "Please check your Cloudflare Pages environment variables and ensure all required variables are set for the Production environment.",
        requiredVariables: [
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET", 
          "NEXTAUTH_SECRET",
          "NEXTAUTH_URL"
        ]
      },
      { status: 500 }
    );
  }
  
  // Redirect to error page for other routes
  const errorUrl = new URL("/api/auth/error?error=Configuration", req.url);
  return NextResponse.redirect(errorUrl);
}

// Only create auth options if required env vars are present
// Otherwise, we'll handle errors in the handlers
const missingVars = getMissingEnvVars();
const hasRequiredConfig = missingVars.length === 0;

export const authOptions = hasRequiredConfig ? {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account?: any; profile?: any }) {
      // Create or update user in database
      try {
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

        const db = createDatabaseFromBinding(env?.DB);
        await db.createOrUpdateUser({
          email: user.email!,
          name: user.name || undefined,
          image: user.image || undefined,
          googleId: account?.providerAccountId || undefined,
        });
      } catch (error) {
        console.error("[NextAuth] Error creating/updating user:", error);
        // Don't block sign-in if user creation fails
      }
      
      return true;
    },
    async session({ session, token }: { session: any; token: any }) {
      // Add user ID to session
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, account, user }: { token: any; account?: any; user?: any }) {
      // Persist user ID in token
      if (account && user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Explicitly set URL to ensure correct callback URL construction
  // NextAuth will use this to construct callback URLs
  url: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://elbespararen.se',
  // Trust host for Cloudflare Pages / Edge runtime
  // This is required for NextAuth.js v5 beta to work correctly in Edge runtime
  trustHost: true,
  // Cookie configuration for Edge runtime compatibility
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://'),
        domain: undefined, // Let browser set domain automatically
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://'),
        domain: undefined, // Let browser set domain automatically
      },
    },
  },
} : null;

// Create NextAuth instance only if config is valid
let auth: any = null;
let authHandlers: { GET?: any; POST?: any } | null = null;

if (hasRequiredConfig && authOptions) {
  try {
    // Create NextAuth instance and export handlers
    // NextAuth.js v5 beta returns an object with handlers property
    // Use type assertion to bypass strict type checking for callbacks
    auth = NextAuth(authOptions as any);
    authHandlers = auth.handlers;
    
    if (!authHandlers) {
      console.error("[auth-config] NextAuth handlers not found");
    }
  } catch (error) {
    console.error("[auth-config] Error initializing NextAuth:", error);
  }
}

// Export handlers with error handling wrapper
// If config is missing or handlers failed to initialize, return configuration error
export const handlers = {
  GET: async (req: NextRequest, context?: any): Promise<Response> => {
    // Check if this is the error route - let it handle itself
    if (req.nextUrl.pathname.includes("/auth/error")) {
      // If handlers are available, use them; otherwise return error response
      if (authHandlers?.GET) {
        try {
          return await authHandlers.GET(req, context);
        } catch (error) {
          return createConfigErrorResponse(req);
        }
      }
      return createConfigErrorResponse(req);
    }
    
    // For other routes, check if config is valid
    if (!hasRequiredConfig || !authHandlers?.GET) {
      return createConfigErrorResponse(req);
    }
    
    try {
      return await authHandlers.GET(req, context);
    } catch (error) {
      console.error("[auth-config] Error in GET handler:", error);
      return createConfigErrorResponse(req);
    }
  },
  POST: async (req: NextRequest, context?: any): Promise<Response> => {
    // Check if this is the error route - let it handle itself
    if (req.nextUrl.pathname.includes("/auth/error")) {
      // If handlers are available, use them; otherwise return error response
      if (authHandlers?.POST) {
        try {
          return await authHandlers.POST(req, context);
        } catch (error) {
          return createConfigErrorResponse(req);
        }
      }
      return createConfigErrorResponse(req);
    }
    
    // For other routes, check if config is valid
    if (!hasRequiredConfig || !authHandlers?.POST) {
      return createConfigErrorResponse(req);
    }
    
    try {
      return await authHandlers.POST(req, context);
    } catch (error) {
      console.error("[auth-config] Error in POST handler:", error);
      return createConfigErrorResponse(req);
    }
  },
} as {
  GET: (req: NextRequest, context?: any) => Promise<Response>;
  POST: (req: NextRequest, context?: any) => Promise<Response>;
};

// Export other auth functions if they exist (only if auth is initialized)
export const signIn = auth?.signIn;
export const signOut = auth?.signOut;
export const getServerSession = auth?.auth;
