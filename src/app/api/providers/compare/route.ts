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

// Hitta det billigaste fastprisalternativet för en provider
function getCheapestFixedPrice(provider: ElectricityProvider, priceArea?: string | null): number {
  if (provider.contractType !== "fastpris" || !provider.avtalsalternativ || provider.avtalsalternativ.length === 0) {
    return provider.energyPrice || 0;
  }

  // Filtrera alternativ efter område om areaCode finns
  const relevantAlternatives = provider.avtalsalternativ.filter(alt => {
    if (!alt.areaCode) return true;
    return priceArea ? alt.areaCode === priceArea : true;
  });

  if (relevantAlternatives.length === 0) {
    return provider.energyPrice || 0;
  }

  // Hitta det lägsta fastpriset
  const prices = relevantAlternatives
    .map(alt => alt.fastpris || 0)
    .filter(price => price > 0);
  
  return prices.length > 0 ? Math.min(...prices) : (provider.energyPrice || 0);
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
        const variableCosts = parseNumber(json.data.variable_costs ?? (json.data as any).variable_costs);
        const elCert = parseNumber(json.data.el_certificate_fee ?? (json.data as any).elCertificateFee);
        const discount = parseNumber(json.data._12_month_discount ?? (json.data as any)['12_month_discount']);
        // Beräkna påslag = surcharge + variable_costs (om det finns) + cert, sedan lägg till discount
        const markup = surcharge + (variableCosts || 0) + elCert;
        const totalOre = markup + discount;
        if (Number.isFinite(totalOre)) {
          const totalKr = totalOre / 100;
          const totalKrInclVat = totalKr * 1.25;
          // Ta bort Math.max(0, ...) för att tillåta negativa värden (rabatter)
          const rounded = Number(totalKrInclVat.toFixed(6));
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

  let finalEnergyPrice: number;
  let monthlyFee: number;

  // För fastprisavtal med flera alternativ, hitta det billigaste alternativet
  if (provider.contractType === "fastpris" && provider.avtalsalternativ && provider.avtalsalternativ.length > 0) {
    const priceArea = billData.priceArea;
    // Filtrera alternativ efter område om areaCode finns
    const relevantAlternatives = provider.avtalsalternativ.filter(alt => {
      if (!alt.areaCode) return true; // Om inget areaCode, använd alltid
      return priceArea ? alt.areaCode === priceArea : true;
    });

    if (relevantAlternatives.length > 0) {
      // Beräkna total kostnad för varje alternativ och välj det billigaste
      const alternativesWithCost = relevantAlternatives.map(alt => {
        const altFastpris = alt.fastpris || 0;
        const altMonthlyFee = alt.månadskostnad || 0;
        const altFreeMonths = alt.gratis_månader || 0;
        // Beräkna effektiv månadskostnad över 12 månader
        const effectiveMonthlyFee = ((altMonthlyFee * (12 - altFreeMonths)) / 12);
        const energyCost = totalKWh * altFastpris;
        const totalCost = elnatCost + energyCost + effectiveMonthlyFee;
        return { alt, totalCost, fastpris: altFastpris, monthlyFee: effectiveMonthlyFee };
      });

      // Sortera efter total kostnad och välj det billigaste
      alternativesWithCost.sort((a, b) => a.totalCost - b.totalCost);
      const cheapestAlt = alternativesWithCost[0];
      finalEnergyPrice = cheapestAlt.fastpris;
      monthlyFee = cheapestAlt.monthlyFee;
    } else {
      // Fallback om inga alternativ matchar området
      finalEnergyPrice = provider.energyPrice || 0;
      const freeMonths = Math.max(0, Math.min(12, provider.freeMonths || 0));
      monthlyFee = ((provider.monthlyFee || 0) * (12 - freeMonths)) / 12;
    }
  } else {
    // För rörliga avtal eller fastpris utan alternativ
    const variableMarkup = await resolveVariableMarkup(provider, billData, origin, markupCache);
    finalEnergyPrice = provider.contractType === "rörligt"
      ? energyPrice + variableMarkup
      : (provider.energyPrice || 0);
    
    // Beräkna effektiv månadskostnad över 12 månader baserat på gratis månader
    const freeMonths = Math.max(0, Math.min(12, provider.freeMonths || 0));
    monthlyFee = ((provider.monthlyFee || 0) * (12 - freeMonths)) / 12;
  }

  const energyCost = totalKWh * finalEnergyPrice;

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

    // Hämta best choice providers från inställningar direkt från databasen
    let bestChoiceProviderIdVariable: string | null = null;
    let bestChoiceProviderIdFixed: string | null = null;
    try {
      const dbAny = db as any;
      if (dbAny.db && typeof dbAny.db.prepare === 'function') {
        // CloudflareDatabase - läs direkt från app_settings tabell
        try {
          const variableResult = await dbAny.db.prepare(`
            SELECT value FROM app_settings WHERE key = 'best_choice_provider_id_variable'
          `).first();
          if (variableResult) {
            bestChoiceProviderIdVariable = String(variableResult.value);
            console.log('[providers/compare] Best choice provider ID (variable) from DB:', bestChoiceProviderIdVariable);
          }
          
          const fixedResult = await dbAny.db.prepare(`
            SELECT value FROM app_settings WHERE key = 'best_choice_provider_id_fixed'
          `).first();
          if (fixedResult) {
            bestChoiceProviderIdFixed = String(fixedResult.value);
            console.log('[providers/compare] Best choice provider ID (fixed) from DB:', bestChoiceProviderIdFixed);
          }
          
          // Backward compatibility: kolla om det finns ett gammalt best_choice_provider_id
          const legacyResult = await dbAny.db.prepare(`
            SELECT value FROM app_settings WHERE key = 'best_choice_provider_id'
          `).first();
          if (legacyResult && !bestChoiceProviderIdVariable && !bestChoiceProviderIdFixed) {
            const legacyId = String(legacyResult.value);
            // Om inget nytt värde finns, använd legacy för båda (för migration)
            bestChoiceProviderIdVariable = legacyId;
            bestChoiceProviderIdFixed = legacyId;
            console.log('[providers/compare] Using legacy best choice provider ID for both:', legacyId);
          }
        } catch (sqlError) {
          // Tabellen kanske inte finns ännu, det är okej
          console.log('[providers/compare] Settings table not found, using default sorting');
        }
      } else {
        // MockDatabase - läs från property
        if (dbAny.bestChoiceProviderIdVariable) {
          bestChoiceProviderIdVariable = dbAny.bestChoiceProviderIdVariable;
          console.log('[providers/compare] Best choice provider ID (variable) from mock:', bestChoiceProviderIdVariable);
        }
        if (dbAny.bestChoiceProviderIdFixed) {
          bestChoiceProviderIdFixed = dbAny.bestChoiceProviderIdFixed;
          console.log('[providers/compare] Best choice provider ID (fixed) from mock:', bestChoiceProviderIdFixed);
        }
        // Backward compatibility
        if (!bestChoiceProviderIdVariable && !bestChoiceProviderIdFixed && dbAny.bestChoiceProviderId) {
          bestChoiceProviderIdVariable = dbAny.bestChoiceProviderId;
          bestChoiceProviderIdFixed = dbAny.bestChoiceProviderId;
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
        const aType = a.provider.contractType;
        const bType = b.provider.contractType;
        
        // Prioritera manuellt vald best choice provider först inom varje kategori
        if (aType === "rörligt" && bType === "rörligt" && bestChoiceProviderIdVariable) {
          const aIsBestChoice = a.provider.id === bestChoiceProviderIdVariable;
          const bIsBestChoice = b.provider.id === bestChoiceProviderIdVariable;
          if (aIsBestChoice && !bIsBestChoice) return -1;
          if (!aIsBestChoice && bIsBestChoice) return 1;
        }
        
        if (aType === "fastpris" && bType === "fastpris" && bestChoiceProviderIdFixed) {
          const aIsBestChoice = a.provider.id === bestChoiceProviderIdFixed;
          const bIsBestChoice = b.provider.id === bestChoiceProviderIdFixed;
          if (aIsBestChoice && !bIsBestChoice) return -1;
          if (!aIsBestChoice && bIsBestChoice) return 1;
        }

        // Grupp 1: Rörligt alltid före Fastpris
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

        // Tie-breaker 3: lägst energyPrice (för fastpris: använd billigaste alternativet)
        const aPrice = a.provider.contractType === "fastpris" 
          ? getCheapestFixedPrice(a.provider, bill.priceArea)
          : (a.provider.energyPrice || 0);
        const bPrice = b.provider.contractType === "fastpris"
          ? getCheapestFixedPrice(b.provider, bill.priceArea)
          : (b.provider.energyPrice || 0);
        return aPrice - bPrice;
      }); // Best choice först inom varje kategori (om vald), sedan rörligt, sedan sortering inom grupp
    
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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
