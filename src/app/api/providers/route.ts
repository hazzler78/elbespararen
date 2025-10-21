import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

export async function GET() {
  try {
    // Hämta D1-binding från Edge-runtime - flera metoder för Cloudflare Pages
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
    
    console.log('[providers] GET - env:', env);
    console.log('[providers] GET - DB binding:', env?.DB);
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
    // Hämta D1-binding från Edge-runtime - flera metoder för Cloudflare Pages
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
    
    console.log('[providers] POST - env:', env);
    console.log('[providers] POST - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    const body = await request.json() as Record<string, unknown>;
    
    // Validera obligatoriska fält
    const requiredFields = ['name', 'description', 'monthlyFee', 'energyPrice'];
    for (const field of requiredFields) {
      // Använd hasOwnProperty och kolla undefined/null, inte falsy (0 är ett giltigt värde)
      if (body[field] === undefined || body[field] === null || body[field] === '') {
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
