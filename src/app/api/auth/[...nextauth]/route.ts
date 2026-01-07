import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createDatabaseFromBinding } from "@/lib/database";

// Note: NextAuth.js v5 beta has issues with Edge runtime
// Using Node.js runtime instead for auth routes
// export const runtime = 'edge'; // Disabled due to compatibility issues

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
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
    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, account, user }) {
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
});

export { handler as GET, handler as POST };
