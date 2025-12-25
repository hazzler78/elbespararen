import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import { BillAnalysis } from "@/lib/types";

export const runtime = 'edge';

// GET - Hämta alla fakturaanalyser
export async function GET(req: NextRequest) {
  try {
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

    // Hämta query parametrar
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const statusParam = url.searchParams.get('status') as BillAnalysis['validationStatus'] | null;
    
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const validationStatus = statusParam || undefined;

    const analyses = await db.getBillAnalyses(limit, validationStatus);

    return NextResponse.json({
      success: true,
      data: analyses,
      count: analyses.length
    });
  } catch (error) {
    console.error("[bill-analyses] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta fakturaanalyser" },
      { status: 500 }
    );
  }
}

