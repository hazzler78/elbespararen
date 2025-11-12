import { NextRequest, NextResponse } from "next/server";
import { ElectricityProvider, ProviderComparison, BillData, ApiResponse } from "@/lib/types";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

interface PriceLookupResponse {
  surcharge?: number;
  el_certificate_fee?: number;
  _12_month_discount?: number;
  [key: string]: unknown;
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function resolveVariableMarkup(
  provider: ElectricityProvider,
  billData: BillData,
  origin: string,
  lookupCache: Map<string, number>
): Promise<number> {
  if (provider.contractType !== "rörligt") {
    return provider.energyPrice || 0;
  }

  const fallbackMarkup = provider.energyPrice || 0;

  const priceArea = billData.priceArea;
  if (!priceArea) {
    return fallbackMarkup;
  }

  const cacheKey = `${provider.id}:${priceArea}`;
  if (lookupCache.has(cacheKey)) {
    return lookupCache.get(cacheKey)!;
  }

  const kwh = billData.totalKWh > 0 ? billData.totalKWh : 2000;

  try {
    const res = await fetch(`${origin}/api/prices/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        providerName: provider.name,
        area: priceArea,
        kwh
      })
    });

    if (res.ok) {
      const json = await res.json() as ApiResponse<PriceLookupResponse>;
      if (json.success && json.data) {
        const surcharge = parseNumber(json.data.surcharge ?? (json.data as any).surcharge);
        const elCert = parseNumber(json.data.el_certificate_fee ?? (json.data as any).elCertificateFee);
        const discount = parseNumber(json.data._12_month_discount ?? (json.data as any)['12_month_discount']);
        const totalOre = surcharge + elCert + discount;
        if (Number.isFinite(totalOre)) {
          const totalKr = totalOre / 100;
          const totalKrInclVat = totalKr * 1.25;
          const rounded = Math.max(0, Number(totalKrInclVat.toFixed(6)));
          lookupCache.set(cacheKey, rounded);
          return rounded;
        }
      }
    } else {
      console.warn(`[providers/compare] Lookup failed for ${provider.name} (${priceArea}): ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.warn(`[providers/compare] Lookup error for ${provider.name}:`, error);
  }

  lookupCache.set(cacheKey, fallbackMarkup);
  return fallbackMarkup;
}

async function calculateProviderCost(
  provider: ElectricityProvider,
  billData: BillData,
  origin: string,
  markupCache: Map<string, number>
): Promise<number> {
  const totalKWh = billData.totalKWh > 0 ? billData.totalKWh : 1;
  const { elnatCost, extraFeesDetailed } = billData;

  // Använd samma logik som "billigaste alternativ"
  // Billigaste alternativ = nuvarande kostnad - besparing
  // AI:n returnerar belopp EXKL. moms, men konsumenter behöver se priser INKL. moms
  const calculatedExtraFees = extraFeesDetailed.reduce((sum, fee) => sum + fee.amount, 0);
  const calculatedExtraFeesWithVAT = calculatedExtraFees * 1.25;
  const cheapestAlternative = billData.totalAmount - calculatedExtraFeesWithVAT;

  // Beräkna energipris baserat på billigaste alternativ
  const availableForEnergy = cheapestAlternative - elnatCost;
  const energyPrice = availableForEnergy / totalKWh;

  // För rörliga avtal, hämta område-specifikt påslag
  const variableMarkup = await resolveVariableMarkup(provider, billData, origin, markupCache);
  const finalEnergyPrice = provider.contractType === "rörligt"
    ? energyPrice + variableMarkup
    : (provider.energyPrice || 0);
  const energyCost = totalKWh * finalEnergyPrice;

  // Beräkna effektiv månadskostnad över 12 månader baserat på gratis månader
  // Exempel: 5 fria månader => betala 7/12 av månadsavgiften i snitt
  const freeMonths = Math.max(0, Math.min(12, provider.freeMonths || 0));
  const monthlyFee = ((provider.monthlyFee || 0) * (12 - freeMonths)) / 12;

  // Total kostnad = elnät + energi + månadskostnad
  return elnatCost + energyCost + monthlyFee;
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
    
    console.log('[providers/compare] POST - env:', env);
    console.log('[providers/compare] POST - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    const body = await request.json() as { billData?: BillData };
    const { billData } = body;

    console.log('[providers/compare] Received request body:', body);
    console.log('[providers/compare] BillData:', billData);

    if (!billData) {
      return NextResponse.json(
        { success: false, error: "BillData är obligatoriskt" },
        { status: 400 }
      );
    }

    const bill: BillData = billData;
    const currentCost = bill.totalAmount;

    // Hämta alla leverantörer från databas
    const providers = await db.getProviders();
    console.log('[providers/compare] Retrieved providers:', providers);

    // Om inga leverantörer hittades från databas, använd fallback
    if (providers.length === 0) {
      console.warn('[providers/compare] No providers found in database, this might indicate D1 database issues');
    }

    // Jämför alla aktiva leverantörer
    const activeProviders = providers.filter(provider => provider.isActive && provider.customerType !== "business");
    console.log('[providers/compare] Active providers:', activeProviders);
    
    const origin = new URL(request.url).origin;
    const markupCache = new Map<string, number>();

    // Hämta best choice provider från inställningar direkt från databasen
    let bestChoiceProviderId: string | null = null;
    try {
      const dbAny = db as any;
      if (dbAny.db && typeof dbAny.db.prepare === 'function') {
        // CloudflareDatabase - läs direkt från app_settings tabell
        try {
          const result = await dbAny.db.prepare(`
            SELECT value FROM app_settings WHERE key = 'best_choice_provider_id'
          `).first();
          if (result) {
            bestChoiceProviderId = String(result.value);
            console.log('[providers/compare] Best choice provider ID from DB:', bestChoiceProviderId);
          }
        } catch (sqlError) {
          // Tabellen kanske inte finns ännu, det är okej
          console.log('[providers/compare] Settings table not found, using default sorting');
        }
      } else {
        // MockDatabase - läs från property
        if (dbAny.bestChoiceProviderId) {
          bestChoiceProviderId = dbAny.bestChoiceProviderId;
          console.log('[providers/compare] Best choice provider ID from mock:', bestChoiceProviderId);
        }
      }
    } catch (error) {
      console.warn('[providers/compare] Could not read best choice setting:', error);
    }

    const comparisons: ProviderComparison[] = (await Promise.all(
      activeProviders.map(async provider => {
        const estimatedCost = await calculateProviderCost(provider, bill, origin, markupCache);
        const estimatedSavings = currentCost - estimatedCost;
        
        console.log(`[providers/compare] Provider ${provider.name}: estimatedCost=${estimatedCost}, estimatedSavings=${estimatedSavings}`);
        
        return {
          provider,
          estimatedMonthlyCost: Math.round(estimatedCost),
          estimatedSavings: Math.round(estimatedSavings),
          isRecommended: false // Sätt till false som default, vi hanterar detta i frontend
        };
      })
    ))
      .sort((a, b) => {
        // Prioritera manuellt vald best choice provider först (om den finns och är aktiv)
        if (bestChoiceProviderId) {
          const aIsBestChoice = a.provider.id === bestChoiceProviderId;
          const bIsBestChoice = b.provider.id === bestChoiceProviderId;
          if (aIsBestChoice && !bIsBestChoice) return -1;
          if (!aIsBestChoice && bIsBestChoice) return 1;
        }

        // Grupp 1: Rörligt alltid före Fastpris
        const aType = a.provider.contractType;
        const bType = b.provider.contractType;
        if (aType !== bType) {
          return aType === "rörligt" ? -1 : 1;
        }

        // Inom samma grupp: sortera efter besparing
        const savingsDiff = b.estimatedSavings - a.estimatedSavings;
        if (Math.abs(savingsDiff) > 1) return savingsDiff; // >1 kr skillnad

        // Tie-breaker 1: flest gratis månader vinner
        const aFree = a.provider.freeMonths || 0;
        const bFree = b.provider.freeMonths || 0;
        if (aFree !== bFree) return bFree - aFree;

        // Tie-breaker 2: lägst månadskostnad
        if (a.provider.monthlyFee !== b.provider.monthlyFee) {
          return (a.provider.monthlyFee || 0) - (b.provider.monthlyFee || 0);
        }

        // Tie-breaker 3: lägst energyPrice
        return (a.provider.energyPrice || 0) - (b.provider.energyPrice || 0);
      }); // Best choice först (om vald), sedan rörligt, sedan sortering inom grupp
    
    // Sätt isRecommended för de bästa alternativen (top 3 som ger besparingar)
    const recommendedCount = Math.min(3, comparisons.filter(c => c.estimatedSavings > 0).length);
    for (let i = 0; i < recommendedCount; i++) {
      if (comparisons[i].estimatedSavings > 0) {
        comparisons[i].isRecommended = true;
      }
    }
    
    console.log('[providers/compare] Final comparisons:', comparisons);

    return NextResponse.json({
      success: true,
      data: {
        currentCost: Math.round(currentCost),
        comparisons,
        totalProviders: comparisons.length,
        recommendedProviders: comparisons.filter(c => c.isRecommended).length
      }
    });
  } catch (error) {
    console.error("[providers/compare] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte jämföra leverantörer" },
      { status: 500 }
    );
  }
}
