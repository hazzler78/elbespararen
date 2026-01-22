import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createDatabaseFromBinding } from "@/lib/database";
import { BillData } from "@/lib/types";
import { calculateSavings } from "@/lib/calculations";

export const runtime = 'edge';

/**
 * Save a pending bill analysis (from sessionStorage) with the authenticated user's ID
 * POST /api/user/save-pending-analysis
 * Body: { billData: BillData }
 */
export async function POST(req: NextRequest) {
  try {
    // Hämta session (användare måste vara inloggad)
    const user = await getSessionUser(req);
    
    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { billData } = body;

    if (!billData) {
      return NextResponse.json(
        { success: false, error: "billData krävs" },
        { status: 400 }
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

    // Beräkna besparingar
    const savings = calculateSavings(billData);

    // Hämta IP och user agent från request
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Spara analysen med user_id
    const savedAnalysis = await db.createBillAnalysis({
      billData,
      savings,
      imageKey: billData.imageKey,
      imageUrl: billData.imageUrl,
      originalFileName: billData.originalFileName,
      postalCode: billData.postalCode,
      priceArea: billData.priceArea,
      aiConfidence: billData.confidence,
      aiWarnings: billData.warnings,
      validationStatus: 'pending',
      ipAddress,
      userAgent,
      userId: dbUser.id
    });

    console.log(`[user/save-pending-analysis] ✅ Analys sparad med user_id: ${dbUser.id}`);

    return NextResponse.json({
      success: true,
      message: "Faktura sparad",
      data: {
        id: savedAnalysis.id,
        userId: dbUser.id
      }
    });
  } catch (error) {
    console.error("[user/save-pending-analysis] POST error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { success: false, error: "Kunde inte spara faktura" },
      { status: 500 }
    );
  }
}
