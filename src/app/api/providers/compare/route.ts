import { NextRequest, NextResponse } from "next/server";
import { ElectricityProvider, ProviderComparison, BillData } from "@/lib/types";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

function calculateProviderCost(provider: ElectricityProvider, billData: BillData): number {
  const { totalKWh, elnatCost, elhandelCost, extraFeesTotal } = billData;
  
  // Använd samma logik som "billigaste alternativ"
  // Billigaste alternativ = nuvarande kostnad - extra avgifter (redan inkl. moms)
  const extraFeesWithVAT = extraFeesTotal; // Redan inkl. moms från AI
  const cheapestAlternative = billData.totalAmount - extraFeesWithVAT;
  
  // För Cheap Energy: använd samma total kostnad som billigaste alternativ
  // men justera energipriset för att matcha
  const targetTotalCost = cheapestAlternative;
  const availableForEnergy = targetTotalCost - elnatCost;
  const energyPrice = Number((availableForEnergy / totalKWh).toFixed(2)); // Avrunda till 2 decimaler
  const energyCost = totalKWh * energyPrice;
  
  // Beräkna månadskostnad (0 kr under gratisperioden)
  const monthlyFee = provider.freeMonths > 0 ? 0 : provider.monthlyFee;
  
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
    const activeProviders = providers.filter(provider => provider.isActive);
    console.log('[providers/compare] Active providers:', activeProviders);
    
    const comparisons: ProviderComparison[] = activeProviders
      .map(provider => {
        const estimatedCost = calculateProviderCost(provider, bill);
        const estimatedSavings = currentCost - estimatedCost;
        
        console.log(`[providers/compare] Provider ${provider.name}: estimatedCost=${estimatedCost}, estimatedSavings=${estimatedSavings}`);
        
        return {
          provider,
          estimatedMonthlyCost: Math.round(estimatedCost),
          estimatedSavings: Math.round(estimatedSavings),
          isRecommended: estimatedSavings > 0
        };
      })
      .sort((a, b) => b.estimatedSavings - a.estimatedSavings); // Sortera efter besparing
    
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
