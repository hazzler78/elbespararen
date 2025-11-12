import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import { ApiResponse } from "@/lib/types";

export const runtime = 'edge';

// Hämta D1-binding från Edge-runtime
async function getBinding() {
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
  
  return { db: createDatabaseFromBinding(env?.DB) };
}

// GET - Hämta best choice provider ID
export async function GET() {
  try {
    const { db } = await getBinding();
    
    // För CloudflareDatabase, använd direkt SQL via type assertion
    // CloudflareDatabase har en privat db property, vi använder any för att komma åt den
    const dbAny = db as any;
    if (dbAny.db && typeof dbAny.db.prepare === 'function') {
      try {
        // Skapa tabell om den inte finns
        await dbAny.db.prepare(`
          CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
        const result = await dbAny.db.prepare(`
          SELECT value FROM app_settings WHERE key = 'best_choice_provider_id'
        `).first();
        
        const providerId = result ? String(result.value) : null;
        
        return NextResponse.json({
          success: true,
          data: { bestChoiceProviderId: providerId }
        } as ApiResponse<{ bestChoiceProviderId: string | null }>);
      } catch (sqlError) {
        console.warn("[settings] SQL error, falling back to mock:", sqlError);
      }
    }
    
    // För MockDatabase, använd in-memory storage
    if (dbAny.bestChoiceProviderId !== undefined) {
      return NextResponse.json({
        success: true,
        data: { bestChoiceProviderId: dbAny.bestChoiceProviderId || null }
      } as ApiResponse<{ bestChoiceProviderId: string | null }>);
    }
    
    return NextResponse.json({
      success: true,
      data: { bestChoiceProviderId: null }
    } as ApiResponse<{ bestChoiceProviderId: string | null }>);
  } catch (error) {
    console.error("[settings] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta inställningar" },
      { status: 500 }
    );
  }
}

// POST - Spara best choice provider ID
export async function POST(request: NextRequest) {
  try {
    const { db } = await getBinding();
    const body = await request.json() as { bestChoiceProviderId: string | null };
    const { bestChoiceProviderId } = body;
    
    // För CloudflareDatabase, använd direkt SQL via type assertion
    const dbAny = db as any;
    if (dbAny.db && typeof dbAny.db.prepare === 'function') {
      try {
        // Skapa tabell om den inte finns
        await dbAny.db.prepare(`
          CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
        // Spara eller uppdatera värdet
        if (bestChoiceProviderId) {
          await dbAny.db.prepare(`
            INSERT OR REPLACE INTO app_settings (key, value, updated_at)
            VALUES ('best_choice_provider_id', ?, CURRENT_TIMESTAMP)
          `).bind(bestChoiceProviderId).run();
        } else {
          // Ta bort om null
          await dbAny.db.prepare(`
            DELETE FROM app_settings WHERE key = 'best_choice_provider_id'
          `).run();
        }
      } catch (sqlError) {
        console.warn("[settings] SQL error, falling back to mock:", sqlError);
        // Fallback till mock database
        dbAny.bestChoiceProviderId = bestChoiceProviderId || null;
      }
    } else {
      // För MockDatabase, spara i minnet
      dbAny.bestChoiceProviderId = bestChoiceProviderId || null;
    }
    
    return NextResponse.json({
      success: true,
      data: { bestChoiceProviderId }
    } as ApiResponse<{ bestChoiceProviderId: string | null }>);
  } catch (error) {
    console.error("[settings] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte spara inställningar" },
      { status: 500 }
    );
  }
}

