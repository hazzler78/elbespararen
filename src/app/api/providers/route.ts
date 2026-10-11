import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

/**
 * Hur gammalt prissvaret får vara innan vi hämtar nya priser.
 *
 * Tidigare fylldes D1 av ett GitHub Actions-cron (22:05 varje dag). GitHub stänger
 * av schemalagda jobb efter 60 dagars repo-inaktivitet — det hände i mars 2026 och
 * priserna stod still i 5,5 månader utan att någon märkte det. Cloudflare Pages har
 * inga cron-triggers, så vi gör som Elchef i stället: kontrollera färskheten vid
 * förfrågan och uppdatera på plats. Då kan priset aldrig bli liggande.
 *
 * Elchef revaliderar var 15:e minut. En timme här ger samma praktiska färskhet med
 * lägre belastning (sex partnerhämtningar i stället för en aggregerad).
 */
const STALE_AFTER_MS = 60 * 60 * 1000;

/** Skydd mot att hamra uppdateringen om updatedAt av någon anledning inte sätts. */
let senasteForsok = 0;
const MIN_MELLAN_MS = 5 * 60 * 1000;

async function refreshPricesIfStale(request: NextRequest, db: any, providers: any[]): Promise<any[]> {
  // VIKTIGT: titta på det ÄLDSTA datumet, inte det nyaste.
  // /api/prices/update lyckas inte alltid för alla leverantörer — i oktober 2026 var
  // Cheap Energy och Stockholms Elbolag färska medan Svealands och Motala låg kvar på
  // 4-5 dagar gamla priser. En kontroll på det nyaste datumet hade sett allt som färskt
  // och lämnat de gamla kvar för evigt.
  const aldsta = providers.reduce((min: number, p: any) => {
    const t = new Date(p?.updatedAt ?? 0).getTime();
    if (!Number.isFinite(t) || t <= 0) return min;
    return min === 0 || t < min ? t : min;
  }, 0);

  if (aldsta > 0 && Date.now() - aldsta < STALE_AFTER_MS) return providers;
  if (Date.now() - senasteForsok < MIN_MELLAN_MS) return providers;
  senasteForsok = Date.now();

  try {
    console.log('[providers] priserna är gamla — uppdaterar');
    // Tidsgräns: uppdateringen hämtar sex partnerfiler. Hänger den ska besökaren
    // hellre få dom befintliga priserna direkt än att sidan står och väntar.
    const res = await fetch(new URL('/api/prices/update', request.url), {
      method: 'POST',
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error(`[providers] prisuppdateringen svarade ${res.status}, behåller befintliga priser`);
      return providers;
    }
    const farska = await db.getAllProviders();
    return farska?.length ? farska : providers;
  } catch (e) {
    console.error('[providers] prisuppdateringen misslyckades, behåller befintliga priser:', e);
    return providers;
  }
}

export async function GET(request: NextRequest) {
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
    
    // Kontrollera om vi ska inkludera dolda leverantörer
    const url = new URL(request.url);
    const includeHidden = url.searchParams.get('includeHidden') === 'true';
    const customerTypeParam = url.searchParams.get('customerType');
    const customerType = customerTypeParam === 'business' ? 'business' : customerTypeParam === 'private' ? 'private' : undefined;
    
    let providers = includeHidden ? await db.getAllProviders() : await db.getProviders(customerType ?? "private");

    // Priserna får aldrig bli liggande — uppdatera på plats om de är gamla.
    providers = await refreshPricesIfStale(request, db, providers);

    if (includeHidden && customerType) {
      providers = providers.filter(provider => provider.customerType === customerType);
    }
    
    return NextResponse.json({
      success: true,
      data: providers
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
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
    const requiredFields = ['name', 'description', 'monthlyFee'];
    for (const field of requiredFields) {
      // Använd hasOwnProperty och kolla undefined/null, inte falsy (0 är ett giltigt värde)
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { success: false, error: `Fält ${field} är obligatoriskt` },
          { status: 400 }
        );
      }
    }

    const customerType = body.customerType === 'business' ? 'business' : 'private';

    const energyPriceValue = body.energyPrice !== undefined && body.energyPrice !== null && body.energyPrice !== ''
      ? Number(body.energyPrice)
      : 0;

    const newProvider = await db.createProvider({
      name: String(body.name),
      description: String(body.description),
      monthlyFee: Number(body.monthlyFee),
      energyPrice: energyPriceValue,
      freeMonths: Number(body.freeMonths) || 0,
      // Bevara 0 för rörligt, defaulta annars till 12 månader om ej angivet
      contractLength: (() => {
        const type = (body.contractType as "rörligt" | "fastpris") || "rörligt";
        if (type === "rörligt") return 0;
        const raw = body.contractLength;
        const num = raw === undefined || raw === null || raw === '' ? undefined : Number(raw);
        return num ?? 12;
      })(),
      contractType: (body.contractType as "rörligt" | "fastpris") || "rörligt",
      isActive: body.isActive !== false,
      customerType,
      features: (body.features as string[]) || [],
      logoUrl: body.logoUrl && String(body.logoUrl).trim() ? String(body.logoUrl).trim() : undefined,
      websiteUrl: body.websiteUrl && String(body.websiteUrl).trim() ? String(body.websiteUrl).trim() : undefined,
      affiliateUrl: body.affiliateUrl && String(body.affiliateUrl).trim() ? String(body.affiliateUrl).trim() : undefined,
      phoneNumber: body.phoneNumber && String(body.phoneNumber).trim() ? String(body.phoneNumber).trim() : undefined
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

export async function PUT(request: NextRequest) {
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
    
    console.log('[providers] PUT - env:', env);
    console.log('[providers] PUT - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    const body = await request.json() as Record<string, unknown>;
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Provider ID är obligatoriskt" },
        { status: 400 }
      );
    }

    console.log('[providers] PUT - updating provider with data:', body);
    
    const existingProvider = await db.getProvider(String(body.id));
    if (!existingProvider) {
      return NextResponse.json(
        { success: false, error: "Leverantör hittades inte" },
        { status: 404 }
      );
    }

    const updatedProvider = await db.updateProvider(String(body.id), {
      name: body.name ? String(body.name) : undefined,
      description: body.description ? String(body.description) : undefined,
      monthlyFee: body.monthlyFee !== undefined ? Number(body.monthlyFee) : undefined,
      energyPrice: body.energyPrice !== undefined ? Number(body.energyPrice) : undefined,
      freeMonths: body.freeMonths !== undefined ? Number(body.freeMonths) : undefined,
      contractLength: body.contractLength !== undefined ? Number(body.contractLength) : undefined,
      contractType: body.contractType ? (body.contractType as "rörligt" | "fastpris") : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      userHidden: body.userHidden !== undefined ? Boolean(body.userHidden) : undefined,
      customerType: body.customerType ? (body.customerType === 'business' ? 'business' : 'private') : undefined,
      features: body.features ? (body.features as string[]) : undefined,
      logoUrl: body.logoUrl && String(body.logoUrl).trim() ? String(body.logoUrl).trim() : undefined,
      websiteUrl: body.websiteUrl && String(body.websiteUrl).trim() ? String(body.websiteUrl).trim() : undefined,
      affiliateUrl: body.affiliateUrl && String(body.affiliateUrl).trim() ? String(body.affiliateUrl).trim() : undefined,
      phoneNumber: body.phoneNumber && String(body.phoneNumber).trim() ? String(body.phoneNumber).trim() : undefined
    });

    console.log('[providers] PUT - successfully updated provider:', updatedProvider);

    return NextResponse.json({
      success: true,
      data: updatedProvider
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("[providers] PUT error:", error);
    const errorMessage = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { success: false, error: `Kunde inte uppdatera leverantör: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    
    console.log('[providers] DELETE - env:', env);
    console.log('[providers] DELETE - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Provider ID är obligatoriskt" },
        { status: 400 }
      );
    }

    const success = await db.deleteProvider(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Leverantör hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Leverantör borttagen"
    });
  } catch (error) {
    console.error("[providers] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte ta bort leverantör" },
      { status: 500 }
    );
  }
}
