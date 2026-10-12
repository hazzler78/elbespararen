import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createDatabaseFromBinding } from "@/lib/database";
import { clampHistoryRange, isPremium } from "@/lib/premium";

// Cloudflare Pages requires Edge runtime for all routes
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    // Hämta session (användare måste vara inloggad)
    const user = await getSessionUser(req);
    
    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    // Hämta D1-binding från Edge-runtime
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

    // Hämta query parametrar — free users are limited to 3 months
    const url = new URL(req.url);
    const requestedRange = url.searchParams.get('range');
    const { range, limited } = clampHistoryRange(dbUser, requestedRange);

    // Hämta användarens fakturaanalyser (clamped for free)
    const analyses = await db.getBillAnalysesByUserId(dbUser.id, range);

    // For free users: count how many analyses exist beyond the free window
    // so the UI can show a concrete reason to upgrade
    let hiddenAnalysesCount = 0;
    const premiumUser = isPremium(dbUser);
    if (!premiumUser) {
      const allAnalyses = await db.getBillAnalysesByUserId(dbUser.id, "all");
      hiddenAnalysesCount = Math.max(0, allAnalyses.length - analyses.length);
    }

    return NextResponse.json({
      success: true,
      data: analyses,
      count: analyses.length,
      meta: {
        range,
        requestedRange: requestedRange || null,
        historyLimited: limited,
        isPremium: premiumUser,
        hiddenAnalysesCount,
      },
    });
  } catch (error) {
    console.error("[user/bill-analyses] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta fakturaanalyser" },
      { status: 500 }
    );
  }
}
