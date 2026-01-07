import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createDatabaseFromBinding } from "@/lib/database";
import type { NextRequest } from "next/server";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
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
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // After OAuth callback, redirect to our callback handler
      if (url.startsWith("/")) {
        return `${baseUrl}/auth/callback?callbackUrl=${encodeURIComponent(url)}`;
      }
      // Allow external redirects if they match our domain
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
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
};

// Create NextAuth instance and export handlers
// NextAuth.js v5 beta returns an object with handlers property
// Use type assertion to bypass strict type checking for callbacks
const auth = NextAuth(authOptions as any);

// Export handlers - NextAuth v5 beta structure
// Type handlers correctly for Next.js App Router
// Ensure handlers exist and are properly typed
const authHandlers = auth.handlers;
if (!authHandlers) {
  throw new Error("NextAuth handlers not found. Check NextAuth.js v5 beta configuration.");
}

// Export handlers with proper typing
export const handlers = {
  GET: authHandlers.GET,
  POST: authHandlers.POST,
} as {
  GET: (req: NextRequest, context?: any) => Promise<Response>;
  POST: (req: NextRequest, context?: any) => Promise<Response>;
};

// Export other auth functions if they exist
export const signIn = auth.signIn;
export const signOut = auth.signOut;
export const getServerSession = auth.auth;
