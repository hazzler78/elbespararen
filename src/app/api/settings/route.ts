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

// GET - Hämta best choice provider IDs
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
        
        // Hämta både variable och fixed best choice IDs
        const variableResult = await dbAny.db.prepare(`
          SELECT value FROM app_settings WHERE key = 'best_choice_provider_id_variable'
        `).first();
        
        const fixedResult = await dbAny.db.prepare(`
          SELECT value FROM app_settings WHERE key = 'best_choice_provider_id_fixed'
        `).first();
        
        // Backward compatibility: kolla om det finns ett gammalt best_choice_provider_id
        const legacyResult = await dbAny.db.prepare(`
          SELECT value FROM app_settings WHERE key = 'best_choice_provider_id'
        `).first();
        
        const variableId = variableResult ? String(variableResult.value) : null;
        const fixedId = fixedResult ? String(fixedResult.value) : null;
        
        // Om inget nytt värde finns men det finns ett gammalt, använd det som fallback
        const legacyId = legacyResult ? String(legacyResult.value) : null;
        
        return NextResponse.json({
          success: true,
          data: { 
            bestChoiceProviderIdVariable: variableId || null,
            bestChoiceProviderIdFixed: fixedId || null,
            // Backward compatibility
            bestChoiceProviderId: legacyId || null
          }
        } as ApiResponse<{ 
          bestChoiceProviderIdVariable: string | null;
          bestChoiceProviderIdFixed: string | null;
          bestChoiceProviderId?: string | null;
        }>);
      } catch (sqlError) {
        console.warn("[settings] SQL error, falling back to mock:", sqlError);
      }
    }
    
    // För MockDatabase, använd in-memory storage
    const variableId = dbAny.bestChoiceProviderIdVariable !== undefined 
      ? dbAny.bestChoiceProviderIdVariable || null 
      : null;
    const fixedId = dbAny.bestChoiceProviderIdFixed !== undefined 
      ? dbAny.bestChoiceProviderIdFixed || null 
      : null;
    const legacyId = dbAny.bestChoiceProviderId !== undefined 
      ? dbAny.bestChoiceProviderId || null 
      : null;
    
    return NextResponse.json({
      success: true,
      data: { 
        bestChoiceProviderIdVariable: variableId,
        bestChoiceProviderIdFixed: fixedId,
        bestChoiceProviderId: legacyId
      }
    } as ApiResponse<{ 
      bestChoiceProviderIdVariable: string | null;
      bestChoiceProviderIdFixed: string | null;
      bestChoiceProviderId?: string | null;
    }>);
  } catch (error) {
    console.error("[settings] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta inställningar" },
      { status: 500 }
    );
  }
}

// POST - Spara best choice provider IDs
export async function POST(request: NextRequest) {
  try {
    const { db } = await getBinding();
    const body = await request.json() as { 
      bestChoiceProviderIdVariable?: string | null;
      bestChoiceProviderIdFixed?: string | null;
      bestChoiceProviderId?: string | null; // Backward compatibility
    };
    
    const { 
      bestChoiceProviderIdVariable, 
      bestChoiceProviderIdFixed,
      bestChoiceProviderId // Legacy support
    } = body;
    
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
        
        // Spara eller uppdatera variable best choice
        if (bestChoiceProviderIdVariable !== undefined) {
          if (bestChoiceProviderIdVariable) {
            await dbAny.db.prepare(`
              INSERT OR REPLACE INTO app_settings (key, value, updated_at)
              VALUES ('best_choice_provider_id_variable', ?, CURRENT_TIMESTAMP)
            `).bind(bestChoiceProviderIdVariable).run();
          } else {
            await dbAny.db.prepare(`
              DELETE FROM app_settings WHERE key = 'best_choice_provider_id_variable'
            `).run();
          }
        }
        
        // Spara eller uppdatera fixed best choice
        if (bestChoiceProviderIdFixed !== undefined) {
          if (bestChoiceProviderIdFixed) {
            await dbAny.db.prepare(`
              INSERT OR REPLACE INTO app_settings (key, value, updated_at)
              VALUES ('best_choice_provider_id_fixed', ?, CURRENT_TIMESTAMP)
            `).bind(bestChoiceProviderIdFixed).run();
          } else {
            await dbAny.db.prepare(`
              DELETE FROM app_settings WHERE key = 'best_choice_provider_id_fixed'
            `).run();
          }
        }
        
        // Backward compatibility: om bestChoiceProviderId skickas, spara som både variable och fixed
        if (bestChoiceProviderId !== undefined) {
          if (bestChoiceProviderId) {
            await dbAny.db.prepare(`
              INSERT OR REPLACE INTO app_settings (key, value, updated_at)
              VALUES ('best_choice_provider_id', ?, CURRENT_TIMESTAMP)
            `).bind(bestChoiceProviderId).run();
          } else {
            await dbAny.db.prepare(`
              DELETE FROM app_settings WHERE key = 'best_choice_provider_id'
            `).run();
          }
        }
      } catch (sqlError) {
        console.warn("[settings] SQL error, falling back to mock:", sqlError);
        // Fallback till mock database
        if (bestChoiceProviderIdVariable !== undefined) {
          dbAny.bestChoiceProviderIdVariable = bestChoiceProviderIdVariable || null;
        }
        if (bestChoiceProviderIdFixed !== undefined) {
          dbAny.bestChoiceProviderIdFixed = bestChoiceProviderIdFixed || null;
        }
        if (bestChoiceProviderId !== undefined) {
          dbAny.bestChoiceProviderId = bestChoiceProviderId || null;
        }
      }
    } else {
      // För MockDatabase, spara i minnet
      if (bestChoiceProviderIdVariable !== undefined) {
        dbAny.bestChoiceProviderIdVariable = bestChoiceProviderIdVariable || null;
      }
      if (bestChoiceProviderIdFixed !== undefined) {
        dbAny.bestChoiceProviderIdFixed = bestChoiceProviderIdFixed || null;
      }
      if (bestChoiceProviderId !== undefined) {
        dbAny.bestChoiceProviderId = bestChoiceProviderId || null;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: { 
        bestChoiceProviderIdVariable: bestChoiceProviderIdVariable !== undefined ? bestChoiceProviderIdVariable : null,
        bestChoiceProviderIdFixed: bestChoiceProviderIdFixed !== undefined ? bestChoiceProviderIdFixed : null
      }
    } as ApiResponse<{ 
      bestChoiceProviderIdVariable: string | null;
      bestChoiceProviderIdFixed: string | null;
    }>);
  } catch (error) {
    console.error("[settings] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte spara inställningar" },
      { status: 500 }
    );
  }
}

