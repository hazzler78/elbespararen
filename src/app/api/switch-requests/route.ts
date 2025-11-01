import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import { sendOrderConfirmationEmail, sendWelcomeEmail, addToNewsletter, getDefaultNewsletterGroupId, getDefaultReceiptsGroupId } from "@/lib/email";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

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
    
    console.log('[switch-requests] POST - env:', env);
    console.log('[switch-requests] POST - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
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

    // Hämta selectedContract om det finns (för fastpris)
    const selectedContract = body.selectedContract as import("@/lib/types").ContractAlternative | undefined;

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

    // Skicka orderbekräftelse via e-post
    try {
      console.log("[switch-requests] Preparing to send order confirmation email to:", switchRequest.customerInfo.email);
      
      // Extrahera prisområde från billData om det finns
      const priceArea = switchRequest.billData?.priceArea || undefined;
      
      // Extrahera kontraktstyp från provider
      const contractType = switchRequest.newProvider?.contractType as "rörligt" | "fast" | "fastpris" | undefined;
      
      // Hämta detaljerad prisinformation för e-postmeddelandet
      let priceInfo: {
        spotPriceOrePerKwh?: number;
        markupOrePerKwh?: number;
        certificateOrePerKwh?: number;
        discountOrePerKwh?: number;
        fixedPriceOrePerKwh?: number;
        monthlyFeeKr?: number;
        validityText?: string;
      } = {};
      
      // För rörligt avtal: hämta prisinformation från API
      if (contractType === "rörligt" && priceArea) {
        try {
          // Hämta normaliserade priser
          const priceLookupResponse = await fetch(
            new URL("/api/prices/lookup", request.url).toString(),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                providerName: switchRequest.newProvider.name,
                area: priceArea.toLowerCase(),
                kwh: switchRequest.billData?.totalKWh || 0
              })
            }
          );
          
          if (priceLookupResponse.ok) {
            const priceData = await priceLookupResponse.json() as { success?: boolean; data?: {
              price?: number; // spotpris i öre/kWh
              surcharge?: number; // påslag i öre/kWh
              el_certificate_fee?: number; // elcertifikat i öre/kWh
              _12_month_discount?: number; // rabatt i öre/kWh
              monthly_fee?: number; // månadsavgift i kr
            } };
            
            if (priceData.success && priceData.data) {
              priceInfo = {
                spotPriceOrePerKwh: priceData.data.price,
                markupOrePerKwh: priceData.data.surcharge,
                certificateOrePerKwh: priceData.data.el_certificate_fee,
                discountOrePerKwh: priceData.data._12_month_discount,
                monthlyFeeKr: priceData.data.monthly_fee
              };
            }
          }
        } catch (priceErr) {
          console.warn("[switch-requests] Could not fetch price details for email:", priceErr);
        }
      } else if (contractType === "fastpris") {
        // För fastpris: använd selectedContract om det finns, annars fallback till provider-data
        const contract = selectedContract;
        if (contract) {
          console.log("[switch-requests] Using selectedContract for fastpris:", {
            namn: contract.namn,
            fastpris: contract.fastpris,
            månadskostnad: contract.månadskostnad,
            bindningstid: contract.bindningstid
          });
          // Använd pris och månadskostnad från valt avtalsalternativ
          priceInfo = {
            fixedPriceOrePerKwh: contract.fastpris ? Math.round(contract.fastpris * 100) : undefined, // Konvertera kr/kWh till öre/kWh
            monthlyFeeKr: contract.månadskostnad !== undefined ? contract.månadskostnad : switchRequest.newProvider.monthlyFee
          };
          // Använd bindningstid från valt avtalsalternativ för validityText
          if (contract.bindningstid) {
            priceInfo.validityText = `${contract.bindningstid} månader`;
          } else if (switchRequest.newProvider.contractLength) {
            priceInfo.validityText = `${switchRequest.newProvider.contractLength} månader`;
          }
        } else {
          console.log("[switch-requests] No selectedContract, using provider defaults for fastpris");
          // Fallback till provider-data om selectedContract saknas
          priceInfo = {
            fixedPriceOrePerKwh: switchRequest.newProvider.energyPrice ? Math.round(switchRequest.newProvider.energyPrice * 100) : undefined,
            monthlyFeeKr: switchRequest.newProvider.monthlyFee,
            validityText: switchRequest.newProvider.contractLength 
              ? `${switchRequest.newProvider.contractLength} månader` 
              : undefined
          };
        }
        console.log("[switch-requests] Fastpris priceInfo for email:", priceInfo);
      }
      
      await sendOrderConfirmationEmail({
        toEmail: switchRequest.customerInfo.email,
        toName: `${switchRequest.customerInfo.firstName} ${switchRequest.customerInfo.lastName}`.trim(),
        switchId: switchRequest.id,
        providerName: switchRequest.newProvider.name,
        estimatedSavings: switchRequest.savings?.potentialSavings,
        contractType: contractType,
        priceArea: priceArea,
        ...priceInfo,
        brand: "Elchef.se"
      });
      
      console.log("[switch-requests] Order confirmation email sent successfully to:", switchRequest.customerInfo.email);
      
      // Lägg även mottagaren i kvitteringsgrupp om satt
      try {
        const receiptsGroup = getDefaultReceiptsGroupId();
        if (receiptsGroup) {
          await addToNewsletter({
            email: switchRequest.customerInfo.email,
            name: `${switchRequest.customerInfo.firstName} ${switchRequest.customerInfo.lastName}`.trim()
          }, receiptsGroup);
          console.log("[switch-requests] Added customer to receipts group:", receiptsGroup);
        }
      } catch (e) {
        console.error("[switch-requests] Failed to add to receipts group:", e);
      }
    } catch (e) {
      console.error("[switch-requests] Failed to send order confirmation:", e);
      // Logga mer detaljer om felet
      if (e instanceof Error) {
        console.error("[switch-requests] Error details:", {
          message: e.message,
          stack: e.stack,
          customerEmail: switchRequest.customerInfo.email
        });
      }
      // Inte kasta felet - låt orderbekräftelsen i UI visa ändå
    }

    // Om kunden samtyckt till marknadsföring: skicka välkomstbrev och lägg till i nyhetsbrev
    if (switchRequest.customerInfo.consentToMarketing && switchRequest.customerInfo.email) {
      try {
        await Promise.all([
          sendWelcomeEmail({
            toEmail: switchRequest.customerInfo.email,
            toName: `${switchRequest.customerInfo.firstName} ${switchRequest.customerInfo.lastName}`.trim()
          }),
          addToNewsletter({
            email: switchRequest.customerInfo.email,
            name: `${switchRequest.customerInfo.firstName} ${switchRequest.customerInfo.lastName}`.trim()
          }, getDefaultNewsletterGroupId())
        ]);
      } catch (e) {
        console.error("[switch-requests] Failed to process marketing welcome/subscription:", e);
      }
    }

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
    
    console.log('[switch-requests] GET - env:', env);
    console.log('[switch-requests] GET - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
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
    
    console.log('[switch-requests] PUT - env:', env);
    console.log('[switch-requests] PUT - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    const body = await request.json() as Record<string, unknown>;
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Switch request ID är obligatoriskt" },
        { status: 400 }
      );
    }

    const updatedSwitchRequest = await db.updateSwitchRequest(String(body.id), {
      status: body.status ? (body.status as import("@/lib/types").SwitchStatus) : undefined,
      notes: body.notes ? String(body.notes) : undefined
    });

    return NextResponse.json({
      success: true,
      data: updatedSwitchRequest
    });
  } catch (error) {
    console.error("[switch-requests] PUT error:", error);
    const message = error instanceof Error ? error.message : "Kunde inte uppdatera bytförfrågan";
    return NextResponse.json(
      { success: false, error: message },
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
    
    console.log('[switch-requests] DELETE - env:', env);
    console.log('[switch-requests] DELETE - DB binding:', env?.DB);
    const db = createDatabaseFromBinding(env?.DB);
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Switch request ID är obligatoriskt" },
        { status: 400 }
      );
    }

    const success = await db.deleteSwitchRequest(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Bytförfrågan hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bytförfrågan borttagen"
    });
  } catch (error) {
    console.error("[switch-requests] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte ta bort bytförfrågan" },
      { status: 500 }
    );
  }
}
