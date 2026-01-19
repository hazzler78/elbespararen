import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createDatabaseFromBinding } from "@/lib/database";
import { isPremium, getUserTier } from "@/lib/premium";

export const runtime = 'edge';

/**
 * Get user info including premium status
 * GET /api/user/info
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await getSessionUser(req);
    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: "Ej autentiserad" },
        { status: 401 }
      );
    }

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

    // Get user from database
    const dbUser = await db.createOrUpdateUser({
      email: user.email,
      name: user.name,
      image: user.image,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
        tier: getUserTier(dbUser),
        isPremium: isPremium(dbUser),
        subscriptionStatus: dbUser.subscriptionStatus,
        subscriptionExpiresAt: dbUser.subscriptionExpiresAt,
      }
    });
  } catch (error) {
    console.error("[user/info] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta användarinfo" },
      { status: 500 }
    );
  }
}
