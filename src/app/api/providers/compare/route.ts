import { NextRequest, NextResponse } from "next/server";
import { ElectricityProvider, ProviderComparison, BillData } from "@/lib/types";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

function calculateProviderCost(provider: ElectricityProvider, billData: BillData): number {
  const { totalKWh, elnatCost, elhandelCost, extraFeesTotal, extraFeesDetailed } = billData;
  
  // Använd samma logik som "billigaste alternativ"
  // Billigaste alternativ = nuvarande kostnad - besparing
  // AI:n returnerar belopp EXKL. moms, men konsumenter behöver se priser INKL. moms
  const calculatedExtraFees = extraFeesDetailed.reduce((sum, fee) => sum + fee.amount, 0);
  const calculatedExtraFeesWithVAT = calculatedExtraFees * 1.25;
  const cheapestAlternative = billData.totalAmount - calculatedExtraFeesWithVAT;
  
  // Beräkna energipris baserat på billigaste alternativ
  const availableForEnergy = cheapestAlternative - elnatCost;
  const energyPrice = availableForEnergy / totalKWh;
  
  // För rörliga avtal, använd provider.energyPrice som påslag
  // För fastpris, använd provider.energyPrice direkt
  const finalEnergyPrice = provider.contractType === "rörligt" 
    ? energyPrice + (provider.energyPrice || 0) 
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
          isRecommended: false // Sätt till false som default, vi hanterar detta i frontend
        };
      })
      .sort((a, b) => b.estimatedSavings - a.estimatedSavings); // Sortera efter besparing
    
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
