import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";

// Use Node.js runtime to satisfy OpenNext bundling
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Hämta D1-binding från Edge-runtime
    // @ts-ignore - getRequestContext finns i next-on-pages runtime
    const { env } = (globalThis as any).getRequestContext?.() ?? { env: {} };
    const db = createDatabaseFromBinding(env?.DB);
    const providers = await db.getProviders();
    // Returnera endast aktiva leverantörer
    const activeProviders = providers.filter(p => p.isActive);
    
    return NextResponse.json({
      success: true,
      data: activeProviders
    });
  } catch (error) {
    console.error("[providers] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta leverantörer" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - getRequestContext finns i next-on-pages runtime
    const { env } = (globalThis as any).getRequestContext?.() ?? { env: {} };
    const db = createDatabaseFromBinding(env?.DB);
    const body = await request.json() as Record<string, unknown>;
    
    // Validera obligatoriska fält
    const requiredFields = ['name', 'description', 'monthlyFee', 'energyPrice'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Fält ${field} är obligatoriskt` },
          { status: 400 }
        );
      }
    }

    const newProvider = await db.createProvider({
      name: String(body.name),
      description: String(body.description),
      monthlyFee: Number(body.monthlyFee),
      energyPrice: Number(body.energyPrice),
      freeMonths: Number(body.freeMonths) || 0,
      contractLength: Number(body.contractLength) || 12,
      isActive: body.isActive !== false,
      features: (body.features as string[]) || [],
      logoUrl: body.logoUrl ? String(body.logoUrl) : undefined,
      websiteUrl: body.websiteUrl ? String(body.websiteUrl) : undefined,
      phoneNumber: body.phoneNumber ? String(body.phoneNumber) : undefined
    });

    return NextResponse.json({
      success: true,
      data: newProvider
    });
  } catch (error) {
    console.error("[providers] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte skapa leverantör" },
      { status: 500 }
    );
  }
}
