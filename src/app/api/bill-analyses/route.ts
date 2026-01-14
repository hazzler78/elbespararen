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

    console.log(`[bill-analyses] GET - Found ${analyses.length} analyses (filter: ${validationStatus || 'all'}, limit: ${limit || 'none'})`);
    
    // Logga datumintervall för debugging
    if (analyses.length > 0) {
      const dates = analyses.map(a => new Date(a.createdAt));
      const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const newestDate = new Date(Math.max(...dates.map(d => d.getTime())));
      console.log(`[bill-analyses] Date range: ${oldestDate.toISOString()} to ${newestDate.toISOString()}`);
    }

    return NextResponse.json({
      success: true,
      data: analyses,
      count: analyses.length
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[bill-analyses] GET error:", errorMessage);
    console.error("[bill-analyses] Error details:", error);
    
    // Ge mer specifik felinformation
    if (errorMessage.includes('no such table') || errorMessage.includes('bill_analyses')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "bill_analyses tabellen saknas. Kör migration 0032_create_bill_analyses.sql",
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Kunde inte hämta fakturaanalyser",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

