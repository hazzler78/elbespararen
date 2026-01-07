import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createDatabaseFromBinding } from "@/lib/database";

// Cloudflare Pages requires Edge runtime for all routes
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    // Hämta session
    const user = await getSessionUser(req);
    
    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    // Hämta D1-binding
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

    // Skapa eller hämta användare
    const dbUser = await db.createOrUpdateUser({
      email: user.email,
      name: user.name,
      image: user.image,
    });

    // Hämta statistik
    const stats = await db.getUserStats(dbUser.id);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("[user/stats] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta statistik" },
      { status: 500 }
    );
  }
}
