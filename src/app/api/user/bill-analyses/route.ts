import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createDatabaseFromBinding } from "@/lib/database";

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

    // Hämta query parametrar
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || 'year';

    // Hämta användarens fakturaanalyser
    const analyses = await db.getBillAnalysesByUserId(dbUser.id, range);

    return NextResponse.json({
      success: true,
      data: analyses,
      count: analyses.length
    });
  } catch (error) {
    console.error("[user/bill-analyses] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta fakturaanalyser" },
      { status: 500 }
    );
  }
}
