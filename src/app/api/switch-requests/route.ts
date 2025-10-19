import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    
    // Validera obligatoriska fält
    const requiredFields = ['customerInfo', 'currentProvider', 'newProvider', 'billData', 'savings'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Fält ${field} är obligatoriskt` },
          { status: 400 }
        );
      }
    }

    // Skapa ny switch request via databas
    const switchRequest = await db.createSwitchRequest({
      customerInfo: body.customerInfo as import("@/lib/types").CustomerInfo,
      currentProvider: body.currentProvider as import("@/lib/types").CurrentProviderInfo,
      newProvider: body.newProvider as import("@/lib/types").ElectricityProvider,
      billData: body.billData as import("@/lib/types").BillData,
      savings: body.savings as import("@/lib/types").SavingsCalculation,
      status: "pending",
      notes: body.notes as string | undefined
    });

    // TODO: Skicka e-post/SMS bekräftelse till kund
    // TODO: Skicka notis till admin
    // TODO: Integrera med leverantörens API

    console.log("New switch request created:", switchRequest);

    return NextResponse.json({
      success: true,
      data: switchRequest
    });
  } catch (error) {
    console.error("[switch-requests] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte skapa bytförfrågan" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Hämta alla switch requests från databas
    const switchRequests = await db.getSwitchRequests();
    
    return NextResponse.json({
      success: true,
      data: switchRequests
    });
  } catch (error) {
    console.error("[switch-requests] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta bytförfrågningar" },
      { status: 500 }
    );
  }
}
