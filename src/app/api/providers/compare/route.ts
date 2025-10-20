import { NextRequest, NextResponse } from "next/server";
import { ElectricityProvider, ProviderComparison, BillData } from "@/lib/types";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

function calculateProviderCost(provider: ElectricityProvider, billData: BillData): number {
  const { totalKWh, elnatCost, elhandelCost, extraFeesTotal } = billData;
  
  // Använd samma logik som "billigaste alternativ"
  // Billigaste alternativ = nuvarande kostnad - extra avgifter (inkl. moms)
  const extraFeesWithVAT = extraFeesTotal * 1.25;
  const cheapestAlternative = billData.totalAmount - extraFeesWithVAT;
  
  // För Cheap Energy: använd samma total kostnad som billigaste alternativ
  // men justera energipriset för att matcha
  const targetTotalCost = cheapestAlternative;
  const availableForEnergy = targetTotalCost - elnatCost;
  const energyPrice = availableForEnergy / totalKWh;
  const energyCost = totalKWh * energyPrice;
  
  // Beräkna månadskostnad (0 kr under gratisperioden)
  const monthlyFee = provider.freeMonths > 0 ? 0 : provider.monthlyFee;
  
  // Total kostnad = elnät + energi + månadskostnad
  return elnatCost + energyCost + monthlyFee;
}

export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - getRequestContext finns i next-on-pages runtime
    const { env } = (globalThis as any).getRequestContext?.() ?? { env: {} };
    const db = createDatabaseFromBinding(env?.DB);
    const body = await request.json() as { billData?: BillData };
    const { billData } = body;

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

    // Jämför alla aktiva leverantörer
    const comparisons: ProviderComparison[] = providers
      .filter(provider => provider.isActive)
      .map(provider => {
        const estimatedCost = calculateProviderCost(provider, bill);
        const estimatedSavings = currentCost - estimatedCost;
        
        return {
          provider,
          estimatedMonthlyCost: Math.round(estimatedCost),
          estimatedSavings: Math.round(estimatedSavings),
          isRecommended: estimatedSavings > 0
        };
      })
      .sort((a, b) => b.estimatedSavings - a.estimatedSavings); // Sortera efter besparing

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
