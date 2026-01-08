import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createDatabaseFromBinding } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get environment variable (works in both Node and Edge runtime)
function getEnvVar(key: string): string | undefined {
  // Try process.env first (works in both Node and Edge runtime)
  const fromProcess = (process.env as any)?.[key];
  if (typeof fromProcess === "string" && fromProcess.length > 0) return fromProcess;
  
  // Try getRequestContext (next-on-pages for Cloudflare Pages)
  try {
    const ctxEnv = (globalThis as any).getRequestContext?.()?.env;
    if (ctxEnv && typeof ctxEnv[key] === "string" && ctxEnv[key]) {
      return ctxEnv[key] as string;
    }
  } catch (e) {
    // getRequestContext might not be available or might throw
  }
  
  // Try globalThis.env (Cloudflare Workers)
  try {
    const workerEnv = (globalThis as any).env;
    if (workerEnv && typeof workerEnv[key] === "string" && workerEnv[key]) {
      return workerEnv[key] as string;
    }
  } catch (e) {
    // globalThis.env might not be available
  }
  
  return undefined;
}

// Helper function to check for missing environment variables at request time
function getMissingEnvVars(): string[] {
  const missing: string[] = [];
  if (!getEnvVar("GOOGLE_CLIENT_ID")) missing.push("GOOGLE_CLIENT_ID");
  if (!getEnvVar("GOOGLE_CLIENT_SECRET")) missing.push("GOOGLE_CLIENT_SECRET");
  if (!getEnvVar("NEXTAUTH_SECRET")) missing.push("NEXTAUTH_SECRET");
  return missing;
}

// Helper function to create configuration error response
function createConfigErrorResponse(req: NextRequest): Response {
  const missingVars = getMissingEnvVars();
  const isErrorRoute = req.nextUrl.pathname.includes("/auth/error");
  
  // Get diagnostic information
  const clientId = getEnvVar("GOOGLE_CLIENT_ID");
  const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
  const secret = getEnvVar("NEXTAUTH_SECRET");
  const url = getEnvVar("NEXTAUTH_URL");
  
  // Build diagnostic info
  const diagnostics: any = {
    envVarsPresent: {
      GOOGLE_CLIENT_ID: !!clientId,
      GOOGLE_CLIENT_SECRET: !!clientSecret,
      NEXTAUTH_SECRET: !!secret,
      NEXTAUTH_URL: !!url,
    },
    initializationError: initializationError || null,
  };
  
  // Add value lengths (for debugging without exposing secrets)
  if (clientId) diagnostics.envVarsPresent.GOOGLE_CLIENT_ID_LENGTH = clientId.length;
  if (clientSecret) diagnostics.envVarsPresent.GOOGLE_CLIENT_SECRET_LENGTH = clientSecret.length;
  if (secret) diagnostics.envVarsPresent.NEXTAUTH_SECRET_LENGTH = secret.length;
  if (url) diagnostics.envVarsPresent.NEXTAUTH_URL_VALUE = url;
  
  if (isErrorRoute) {
    // Return JSON for API error route
    return NextResponse.json(
      {
        error: "Configuration Error",
        message: missingVars.length > 0 
          ? "NextAuth is missing required environment variables"
          : "NextAuth configuration error (variables present but initialization failed)",
        missingVariables: missingVars,
        diagnostics,
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

// Helper function to create auth options dynamically (checks env vars at runtime)
function createAuthOptions() {
  const clientId = getEnvVar("GOOGLE_CLIENT_ID");
  const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
  const secret = getEnvVar("NEXTAUTH_SECRET");
  const url = getEnvVar("NEXTAUTH_URL") || getEnvVar("NEXT_PUBLIC_APP_URL") || 'https://elbespararen.se';
  
  if (!clientId || !clientSecret || !secret) {
    return null;
  }
  
  return {
    providers: [
      GoogleProvider({
        clientId,
        clientSecret,
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
    secret,
    // Explicitly set URL to ensure correct callback URL construction
    // NextAuth will use this to construct callback URLs
    url,
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
        secure: process.env.NODE_ENV === 'production' || url.startsWith('https://'),
        domain: undefined, // Let browser set domain automatically
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' || url.startsWith('https://'),
        domain: undefined, // Let browser set domain automatically
      },
    },
  },
  };
}

// Note: authOptions cannot be created at module load time in Edge runtime
// because env vars are only available at request time via getRequestContext()
// We'll create the auth instance dynamically in the handlers

// Cache for auth instance and handlers (created per request if needed)
let cachedAuth: any = null;
let cachedAuthHandlers: { GET?: any; POST?: any } | null = null;
let lastConfigHash: string | null = null;

// Store initialization error for debugging
let initializationError: string | null = null;

// Get or create auth handlers dynamically at request time
function getAuthHandlers(): { GET?: any; POST?: any } | null {
  const authOptions = createAuthOptions();
  if (!authOptions) {
    initializationError = "Auth options could not be created - missing required environment variables";
    return null;
  }
  
  // CRITICAL FIX: Inject env vars into process.env for NextAuth validation
  // NextAuth v5 beta checks process.env during request handling, which fails in Edge runtime
  // We need to ensure process.env has the values when NextAuth validates
  const clientId = getEnvVar("GOOGLE_CLIENT_ID");
  const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
  const secret = getEnvVar("NEXTAUTH_SECRET");
  const url = getEnvVar("NEXTAUTH_URL") || getEnvVar("NEXT_PUBLIC_APP_URL") || 'https://elbespararen.se';
  
  if (clientId && !(process.env as any).GOOGLE_CLIENT_ID) {
    (process.env as any).GOOGLE_CLIENT_ID = clientId;
  }
  if (clientSecret && !(process.env as any).GOOGLE_CLIENT_SECRET) {
    (process.env as any).GOOGLE_CLIENT_SECRET = clientSecret;
  }
  if (secret && !(process.env as any).NEXTAUTH_SECRET) {
    (process.env as any).NEXTAUTH_SECRET = secret;
  }
  if (url && !(process.env as any).NEXTAUTH_URL) {
    (process.env as any).NEXTAUTH_URL = url;
  }
  
  // Create a hash of the config to detect changes
  const configHash = `${authOptions.providers[0].clientId}-${authOptions.secret}`;
  
  // Return cached handlers if config hasn't changed
  if (cachedAuthHandlers && lastConfigHash === configHash) {
    return cachedAuthHandlers;
  }
  
  // Reset error
  initializationError = null;
  
  try {
    // Create NextAuth instance and export handlers
    // NextAuth.js v5 beta returns an object with handlers property
    cachedAuth = NextAuth(authOptions as any);
    cachedAuthHandlers = cachedAuth.handlers;
    lastConfigHash = configHash;
    
    if (!cachedAuthHandlers) {
      initializationError = "NextAuth handlers not found after initialization";
      console.error("[auth-config] NextAuth handlers not found");
      return null;
    }
    
    return cachedAuthHandlers;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    initializationError = `NextAuth initialization failed: ${errorMessage}`;
    console.error("[auth-config] Error initializing NextAuth:", error);
    return null;
  }
}

// Export handlers with error handling wrapper
// If config is missing or handlers failed to initialize, return configuration error
export const handlers = {
  GET: async (req: NextRequest, context?: any): Promise<Response> => {
    const pathname = req.nextUrl.pathname;
    
    // CRITICAL FIX: Ensure process.env has env vars before NextAuth validates
    // NextAuth v5 beta checks process.env during request handling in Edge runtime
    const clientId = getEnvVar("GOOGLE_CLIENT_ID");
    const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
    const secret = getEnvVar("NEXTAUTH_SECRET");
    const url = getEnvVar("NEXTAUTH_URL") || getEnvVar("NEXT_PUBLIC_APP_URL") || 'https://elbespararen.se';
    
    if (clientId && !(process.env as any).GOOGLE_CLIENT_ID) {
      (process.env as any).GOOGLE_CLIENT_ID = clientId;
    }
    if (clientSecret && !(process.env as any).GOOGLE_CLIENT_SECRET) {
      (process.env as any).GOOGLE_CLIENT_SECRET = clientSecret;
    }
    if (secret && !(process.env as any).NEXTAUTH_SECRET) {
      (process.env as any).NEXTAUTH_SECRET = secret;
    }
    if (url && !(process.env as any).NEXTAUTH_URL) {
      (process.env as any).NEXTAUTH_URL = url;
    }
    
    // For error route, let NextAuth handle it first, then fall back to custom handler
    if (pathname.includes("/auth/error")) {
      const authHandlers = getAuthHandlers();
      // If NextAuth handlers exist, let NextAuth handle the error route
      if (authHandlers?.GET) {
        try {
          // Create a new request with mutable headers to avoid immutable error
          // Copy headers manually to create new mutable Headers object
          const mutableHeaders = new Headers();
          req.headers.forEach((value, key) => {
            mutableHeaders.set(key, value);
          });
          const mutableReq = new NextRequest(req.url, {
            method: req.method,
            headers: mutableHeaders,
            body: req.body,
          });
          return await authHandlers.GET(mutableReq, context);
        } catch (error) {
          console.error("[auth-config] NextAuth error handler failed:", error);
          // Fall through to custom error handler
        }
      }
      // Custom error handler as fallback
      return createConfigErrorResponse(req);
    }
    
    // Get auth handlers (creates them if config is valid)
    const authHandlers = getAuthHandlers();
    
    // If handlers are not available, return config error
    if (!authHandlers?.GET) {
      console.error(`[auth-config] No auth handlers available for ${pathname}. Initialization error: ${initializationError || 'unknown'}`);
      return createConfigErrorResponse(req);
    }
    
    try {
      // Create a new request with mutable headers to avoid immutable error
      // NextAuth may try to modify headers, which fails with immutable headers in Edge runtime
      // Copy headers manually to create new mutable Headers object
      const mutableHeaders = new Headers();
      req.headers.forEach((value, key) => {
        mutableHeaders.set(key, value);
      });
      const mutableReq = new NextRequest(req.url, {
        method: req.method,
        headers: mutableHeaders,
        body: req.body,
      });
      const response = await authHandlers.GET(mutableReq, context);
      
      // Check if NextAuth redirected to error route
      if (response.status === 302 || response.status === 307) {
        const location = response.headers.get('location');
        if (location?.includes('/auth/error')) {
          console.error(`[auth-config] NextAuth redirected to error route from ${pathname}. Location: ${location}`);
        }
        // For redirects, recreate response with mutable headers
        const redirectHeaders = new Headers();
        response.headers.forEach((value: string, key: string) => {
          redirectHeaders.set(key, value);
        });
        return new Response(null, {
          status: response.status,
          statusText: response.statusText,
          headers: redirectHeaders,
        });
      }
      
      // Recreate response with mutable headers to avoid immutable error
      // NextAuth may return a response with immutable headers
      const responseHeaders = new Headers();
      response.headers.forEach((value: string, key: string) => {
        responseHeaders.set(key, value);
      });
      
      // Get response body if it exists - clone before reading to avoid consuming original
      let body: ArrayBuffer | null = null;
      if (response.body) {
        try {
          body = await response.clone().arrayBuffer();
        } catch (e) {
          // If cloning fails, try reading directly (may fail if already consumed)
          console.warn(`[auth-config] Could not clone response body: ${e}`);
        }
      }
      
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error(`[auth-config] Error in GET handler for ${pathname}:`, errorMessage);
      if (errorStack) {
        console.error(`[auth-config] Error stack:`, errorStack);
      }
      // If it's a configuration error, redirect to error route
      if (errorMessage.includes("Configuration") || errorMessage.includes("NEXTAUTH")) {
        const errorUrl = new URL("/api/auth/error?error=Configuration", req.url);
        return NextResponse.redirect(errorUrl);
      }
      return createConfigErrorResponse(req);
    }
  },
  POST: async (req: NextRequest, context?: any): Promise<Response> => {
    const pathname = req.nextUrl.pathname;
    
    // For error route, let NextAuth handle it first, then fall back to custom handler
    if (pathname.includes("/auth/error")) {
      const authHandlers = getAuthHandlers();
      // If NextAuth handlers exist, let NextAuth handle the error route
      if (authHandlers?.POST) {
        try {
          // Create a new request with mutable headers to avoid immutable error
          // Copy headers manually to create new mutable Headers object
          const mutableHeaders = new Headers();
          req.headers.forEach((value, key) => {
            mutableHeaders.set(key, value);
          });
          const mutableReq = new NextRequest(req.url, {
            method: req.method,
            headers: mutableHeaders,
            body: req.body,
          });
          return await authHandlers.POST(mutableReq, context);
        } catch (error) {
          console.error("[auth-config] NextAuth error handler failed:", error);
          // Fall through to custom error handler
        }
      }
      // Custom error handler as fallback
      return createConfigErrorResponse(req);
    }
    
    // CRITICAL FIX: Ensure process.env has env vars before NextAuth validates
    // NextAuth v5 beta checks process.env during request handling in Edge runtime
    const clientId = getEnvVar("GOOGLE_CLIENT_ID");
    const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
    const secret = getEnvVar("NEXTAUTH_SECRET");
    const url = getEnvVar("NEXTAUTH_URL") || getEnvVar("NEXT_PUBLIC_APP_URL") || 'https://elbespararen.se';
    
    if (clientId && !(process.env as any).GOOGLE_CLIENT_ID) {
      (process.env as any).GOOGLE_CLIENT_ID = clientId;
    }
    if (clientSecret && !(process.env as any).GOOGLE_CLIENT_SECRET) {
      (process.env as any).GOOGLE_CLIENT_SECRET = clientSecret;
    }
    if (secret && !(process.env as any).NEXTAUTH_SECRET) {
      (process.env as any).NEXTAUTH_SECRET = secret;
    }
    if (url && !(process.env as any).NEXTAUTH_URL) {
      (process.env as any).NEXTAUTH_URL = url;
    }
    
    // Get auth handlers (creates them if config is valid)
    const authHandlers = getAuthHandlers();
    
    // If handlers are not available, return config error
    if (!authHandlers?.POST) {
      console.error(`[auth-config] No auth handlers available for ${pathname}. Initialization error: ${initializationError || 'unknown'}`);
      return createConfigErrorResponse(req);
    }
    
    try {
      // Create a new request with mutable headers to avoid immutable error
      // NextAuth may try to modify headers, which fails with immutable headers in Edge runtime
      // Copy headers manually to create new mutable Headers object
      const mutableHeaders = new Headers();
      req.headers.forEach((value, key) => {
        mutableHeaders.set(key, value);
      });
      const mutableReq = new NextRequest(req.url, {
        method: req.method,
        headers: mutableHeaders,
        body: req.body,
      });
      const response = await authHandlers.POST(mutableReq, context);
      
      // Recreate response with mutable headers to avoid immutable error
      // NextAuth may return a response with immutable headers
      const responseHeaders = new Headers();
      response.headers.forEach((value: string, key: string) => {
        responseHeaders.set(key, value);
      });
      
      // Get response body if it exists
      const body = response.body ? await response.clone().arrayBuffer() : null;
      
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[auth-config] Error in POST handler for ${pathname}:`, errorMessage);
      // If it's a configuration error, redirect to error route
      if (errorMessage.includes("Configuration") || errorMessage.includes("NEXTAUTH")) {
        const errorUrl = new URL("/api/auth/error?error=Configuration", req.url);
        return NextResponse.redirect(errorUrl);
      }
      return createConfigErrorResponse(req);
    }
  },
} as {
  GET: (req: NextRequest, context?: any) => Promise<Response>;
  POST: (req: NextRequest, context?: any) => Promise<Response>;
};

// Export other auth functions (they'll be created dynamically when needed)
export const signIn = cachedAuth?.signIn;
export const signOut = cachedAuth?.signOut;
export const getServerSession = cachedAuth?.auth;
