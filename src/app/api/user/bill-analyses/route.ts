import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createDatabaseFromBinding } from "@/lib/database";
import {
  clampHistoryRange,
  isPremium,
  PREMIUM_LIMITS,
} from "@/lib/premium";

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
    let analyses = await db.getBillAnalysesByUserId(dbUser.id, range);

    // Free: max 2 sparade synliga + 3 mån fönster. Räkna dolda så UI kan uppgradera.
    let hiddenAnalysesCount = 0;
    let totalSavedCount = analyses.length;
    const premiumUser = isPremium(dbUser);
    if (!premiumUser) {
      const allAnalyses = await db.getBillAnalysesByUserId(dbUser.id, "all");
      totalSavedCount = allAnalyses.length;
      const maxSaved = PREMIUM_LIMITS.FREE.maxSavedAnalyses;
      // Dolda p.g.a. tidsfönster (utanför 3 mån)
      const outsideWindow = Math.max(0, allAnalyses.length - analyses.length);
      // Dolda p.g.a. spargräns (fler än 2 inom fönstret)
      let overSaveLimit = 0;
      if (analyses.length > maxSaved) {
        overSaveLimit = analyses.length - maxSaved;
        analyses = analyses.slice(0, maxSaved);
      }
      hiddenAnalysesCount = outsideWindow + overSaveLimit;
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
        totalSavedCount,
        freeSaveLimit: premiumUser
          ? null
          : PREMIUM_LIMITS.FREE.maxSavedAnalyses,
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
