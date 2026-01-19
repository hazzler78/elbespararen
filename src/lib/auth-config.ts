import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createDatabaseFromBinding } from "@/lib/database";
import { verifyPassword } from "@/lib/password";
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
  
  // Determine if we're in production (HTTPS)
  const isProduction = url.startsWith('https://');
  
  return {
  providers: [
    GoogleProvider({
        clientId,
        clientSecret,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get database
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
          console.log("[NextAuth] Credentials authorize: Database type:", db.constructor.name);

          // Get user from database
          console.log("[NextAuth] Credentials authorize: Looking for user:", credentials.email);
          const user = await db.getUserByEmail(credentials.email as string);
          if (!user) {
            console.log("[NextAuth] Credentials authorize: User not found:", credentials.email);
            // Try to list all users in MockDatabase for debugging
            if (db.constructor.name === 'MockDatabase') {
              const allUsers = (db as any).users || [];
              console.log("[NextAuth] Credentials authorize: All users in MockDatabase:", allUsers.map((u: any) => ({ id: u.id, email: u.email })));
            }
            return null;
          }
          console.log("[NextAuth] Credentials authorize: User found:", { id: user.id, email: user.email });

          // Check if user has password (email/password account)
          const passwordHash = (user as any).passwordHash;
          if (!passwordHash) {
            // User exists but doesn't have password (Google account)
            console.log("[NextAuth] Credentials authorize: User has no password hash:", credentials.email);
            return null;
          }

          // Verify password
          console.log("[NextAuth] Credentials authorize: Verifying password for:", credentials.email);
          const isValid = await verifyPassword(credentials.password as string, passwordHash);
          if (!isValid) {
            console.log("[NextAuth] Credentials authorize: Password verification failed for:", credentials.email);
            return null;
          }
          
          console.log("[NextAuth] Credentials authorize: Password verified successfully for:", credentials.email);

          // Return user object for NextAuth
          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            image: user.image || undefined,
          };
        } catch (error) {
          console.error("[NextAuth] Credentials authorize error:", error);
          return null;
        }
      }
    }),
  ],
    // Set basePath to ensure NextAuth v5 beta can parse routes correctly in Edge runtime
    basePath: '/api/auth',
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
      // Add user ID and other info to session
      console.log("[NextAuth] Session callback - token:", { id: token.id, sub: token.sub, email: token.email, name: token.name });
      console.log("[NextAuth] Session callback - session.user:", session.user);
      
      if (session.user && token) {
        // Use token data to populate session
        (session.user as any).id = token.id || token.sub || session.user.email;
        // Ensure email, name, and image are set from token (prefer token over session)
        if (token.email) {
          session.user.email = token.email;
        }
        if (token.name) {
          session.user.name = token.name;
        }
        if (token.picture) {
          session.user.image = token.picture;
        }
      }
      
      // Ensure session has required fields
      if (!session.user?.email) {
        console.error("[NextAuth] Session callback ERROR: Session missing email!");
        return null; // Return null to invalidate session
      }
      
      console.log("[NextAuth] Session callback - final session.user:", session.user);
      return session;
    },
    async jwt({ token, account, user }: { token: any; account?: any; user?: any }) {
      // Persist user ID in token
      // For Credentials provider, account might be null/undefined, but user exists
      // For OAuth providers, both account and user exist
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        // Set sub (subject) to user ID for NextAuth compatibility
        token.sub = user.id;
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
  // Important: Cookies must work in both development and production
  cookies: {
    sessionToken: {
      name: isProduction ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // 'lax' allows cookies to be sent with same-site requests
        path: '/',
        secure: isProduction, // Secure cookies only in production (HTTPS required)
        // Don't set domain - let browser handle it automatically for same-origin
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: isProduction ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
        maxAge: 60 * 60, // 1 hour
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
  // Use clientId from env vars instead of accessing from provider to avoid TypeScript union type issues
  const configHash = `${clientId}-${authOptions.secret}`;
  
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
    
    // Log callback route to debug OAuth callback handling
    if (pathname.includes('/api/auth/callback/google')) {
      console.log(`[auth-config] CALLBACK: Google OAuth callback route hit: ${pathname}`);
      console.log(`[auth-config] CALLBACK: Request URL: ${req.url}`);
      console.log(`[auth-config] CALLBACK: Query params: ${req.nextUrl.searchParams.toString()}`);
      console.log(`[auth-config] CALLBACK: Context params: ${JSON.stringify(context?.params)}`);
    }
    
    // WORKAROUND: NextAuth v5 beta.30 has a bug parsing provider signin routes in Edge runtime
    // Intercept /api/auth/signin/google and manually redirect to Google OAuth
    if (pathname === '/api/auth/signin/google' || pathname.match(/^\/api\/auth\/signin\/google/)) {
      console.log(`[auth-config] WORKAROUND: Intercepted signin/google route: ${pathname}`);
      const clientId = getEnvVar("GOOGLE_CLIENT_ID");
      const baseUrl = getEnvVar("NEXTAUTH_URL") || getEnvVar("NEXT_PUBLIC_APP_URL") || req.nextUrl.origin;
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl') || '/dashboard';
      
      if (!clientId) {
        console.error(`[auth-config] Google Client ID missing for manual signin redirect`);
        return createConfigErrorResponse(req);
      }
      
      // Manually construct Google OAuth URL
      // CRITICAL: The redirect URI must EXACTLY match what's configured in Google Cloud Console
      // Format: {baseUrl}/api/auth/callback/google
      // Ensure baseUrl doesn't have trailing slash
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const redirectUri = `${cleanBaseUrl}/api/auth/callback/google`;
      
      console.log(`[auth-config] WORKAROUND: Manual Google OAuth redirect`);
      console.log(`[auth-config] Request URL: ${req.url}`);
      console.log(`[auth-config] Base URL: ${baseUrl} -> Clean: ${cleanBaseUrl}`);
      console.log(`[auth-config] Redirect URI: ${redirectUri}`);
      console.log(`[auth-config] Callback URL param: ${callbackUrl}`);
      console.log(`[auth-config] ⚠️  IMPORTANT: Make sure this redirect URI is EXACTLY configured in Google Cloud Console:`);
      console.log(`[auth-config]   1. Go to Google Cloud Console > APIs & Services > Credentials`);
      console.log(`[auth-config]   2. Edit your OAuth 2.0 Client ID`);
      console.log(`[auth-config]   3. Add to "Authorized redirect URIs": ${redirectUri}`);
      console.log(`[auth-config]   4. If app is in "Testing" mode, add your email to "Test users" in OAuth consent screen`);
      console.log(`[auth-config]   5. Wait a few minutes for changes to propagate`);
      
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.set('client_id', clientId);
      googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');
      // Store callbackUrl in state for later retrieval
      // Use btoa for Edge runtime compatibility (Buffer might not be available)
      const stateData = JSON.stringify({ callbackUrl });
      const state = btoa(unescape(encodeURIComponent(stateData))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      googleAuthUrl.searchParams.set('state', state);
      
      return NextResponse.redirect(googleAuthUrl.toString());
    }
    
    // Get auth handlers (creates them if config is valid)
    const authHandlers = getAuthHandlers();
    
    // If handlers are not available, return config error
    if (!authHandlers?.GET) {
      console.error(`[auth-config] No auth handlers available for ${pathname}. Initialization error: ${initializationError || 'unknown'}`);
      return createConfigErrorResponse(req);
    }
    
    try {
      // CRITICAL: NextAuth v5 beta might parse routes from the original request object
      // Try passing the original request first to see if that helps with route parsing
      // If we get immutable error, fall back to creating a mutable request
      let response: Response;
      try {
        // CRITICAL FIX: NextAuth v5 beta parses routes from the request URL pathname
        // The URL should NOT have nextauth query params - those break route parsing
        // Ensure we're using a clean URL without any nextauth query params
        const cleanUrl = new URL(req.url);
        // Remove any nextauth query params that might have been added
        cleanUrl.searchParams.delete('nextauth');
        
        // NextAuth v5 beta with basePath expects the pathname to include the basePath
        // But it might parse routes differently - let's ensure the URL structure is correct
        const cleanReq = new NextRequest(cleanUrl, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
        
        console.log(`[auth-config] Attempting with clean request: ${cleanReq.url}`);
        console.log(`[auth-config] Pathname: ${cleanReq.nextUrl.pathname}, basePath: /api/auth`);
        console.log(`[auth-config] Context params: ${JSON.stringify(context?.params)}`);
        
        // NextAuth v5 beta might parse routes from URL pathname automatically
        // Try with empty context first - NextAuth should parse from URL
        try {
          response = await authHandlers.GET(cleanReq, {});
          console.log(`[auth-config] Success with empty context! Status: ${response.status}`);
        } catch (noContextError: any) {
          // If that fails, try with context params
          console.log(`[auth-config] Empty context failed, trying with params: ${noContextError?.message}`);
          response = await authHandlers.GET(cleanReq, context);
          console.log(`[auth-config] Success with context params! Status: ${response.status}`);
        }
      } catch (immutableError: any) {
        // If we get immutable error, create a new request with mutable headers
        if (immutableError?.message?.includes('immutable') || immutableError?.name === 'TypeError') {
          console.log(`[auth-config] Got immutable error (${immutableError?.message}), creating mutable request`);
          const mutableHeaders = new Headers();
          req.headers.forEach((value, key) => {
            mutableHeaders.set(key, value);
          });
          const mutableReq = new NextRequest(req.url, {
            method: req.method,
            headers: mutableHeaders,
            body: req.body,
          });
          console.log(`[auth-config] Calling NextAuth GET handler with mutableReq.pathname: ${mutableReq.nextUrl.pathname}, context params: ${JSON.stringify(context?.params)}`);
          response = await authHandlers.GET(mutableReq, context);
        } else {
          // Re-throw if it's not an immutable error
          throw immutableError;
        }
      }
      
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
