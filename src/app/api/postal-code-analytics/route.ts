import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      postalCode: string;
      detectedArea?: string;
      selectedArea: string;
      wasManuallyChanged: boolean;
      pageContext?: string;
    };

    const { postalCode, detectedArea, selectedArea, wasManuallyChanged, pageContext } = body;

    // Validera input
    if (!postalCode || !selectedArea) {
      return NextResponse.json(
        { success: false, error: "Postnummer och valt område krävs" },
        { status: 400 }
      );
    }

    // Validera att selectedArea är ett giltigt område
    const validAreas = ['se1', 'se2', 'se3', 'se4'];
    if (!validAreas.includes(selectedArea.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Ogiltigt område" },
        { status: 400 }
      );
    }

    // Hämta D1-binding från Edge-runtime
    let env: any = {};
    
    // Metod 1: getRequestContext (next-on-pages)
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    
    // Metod 2: process.env.DB (direkt access)
    if (!env.DB && (process.env as any).DB) {
      env.DB = (process.env as any).DB;
    }
    
    // Metod 3: globalThis.env (Cloudflare Workers)
    if (!env.DB && (globalThis as any).env?.DB) {
      env.DB = (globalThis as any).env.DB;
    }
    
    const db = createDatabaseFromBinding(env?.DB);

    // Hämta IP-adress och user agent från request headers
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;

    // Skapa analytics entry
    const analytics = await db.createPostalCodeAnalytics({
      postalCode,
      detectedArea: detectedArea || undefined,
      selectedArea: selectedArea.toLowerCase(),
      wasManuallyChanged,
      ipAddress,
      userAgent,
      pageContext: pageContext || undefined
    });

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error("[postal-code-analytics] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Om tabellen inte finns ännu, returnera success men logga varning
    if (errorMessage.includes('postal_code_analytics table does not exist')) {
      console.warn("[postal-code-analytics] Table does not exist yet. Migration may be needed.");
      return NextResponse.json({
        success: true,
        warning: "Analytics table not available yet"
      });
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
