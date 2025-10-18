import { NextRequest, NextResponse } from "next/server";
import { SwitchRequest } from "@/lib/types";
import { db } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
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
      customerInfo: body.customerInfo,
      currentProvider: body.currentProvider,
      newProvider: body.newProvider,
      billData: body.billData,
      savings: body.savings,
      status: "pending",
      notes: body.notes
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
