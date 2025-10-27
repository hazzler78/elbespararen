import { NextRequest, NextResponse } from "next/server";
import { Lead, BillData, SavingsCalculation } from "@/lib/types";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

export async function GET() {
  try {
    // Hämta D1-binding från Edge-runtime
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
    
    const db = createDatabaseFromBinding(env?.DB);
    const leads = await db.getLeads();
    
    return NextResponse.json({
      success: true,
      data: leads,
      count: leads.length
    });
  } catch (error) {
    console.error("[leads] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; phone?: string; billData?: BillData; savings?: SavingsCalculation };
    const { email, phone, billData, savings } = body;
    
    console.log("[leads] POST request received:", { email, phone, hasBillData: !!billData, hasSavings: !!savings });

    // Validera input
    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "E-post eller telefon krävs" },
        { status: 400 }
      );
    }

    if (!billData || !savings) {
      return NextResponse.json(
        { success: false, error: "BillData och savings krävs" },
        { status: 400 }
      );
    }

    // Hämta D1-binding från Edge-runtime
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
    
    const db = createDatabaseFromBinding(env?.DB);
    console.log("[leads] Database created, type:", db.constructor.name);

    // Skapa lead-objekt
    const leadData = {
      email: email || "",
      phone: phone || "",
      billData,
      savings,
      status: "new" as const
    };

    console.log("[leads] Creating lead with data:", leadData);
    const lead = await db.createLead(leadData);
    console.log("[leads] Ny lead skapad:", lead.id);

    // Skicka Telegram-notis
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      console.log("[leads] Sending Telegram notification...");
      await sendTelegramNotification(lead);
    } else {
      console.log("[leads] Telegram not configured - skipping notification");
    }

    return NextResponse.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error("[leads] POST error:", error);
    const errorMessage = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { success: false, error: `Kunde inte skapa lead: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Skickar Telegram-notis om ny lead
 */
async function sendTelegramNotification(lead: Lead) {
  const message = `
🔔 *Ny lead från Elbespararen!*

📧 Email: ${lead.email || "Ej angiven"}
📱 Telefon: ${lead.phone || "Ej angiven"}

💰 Besparing: *${lead.savings.potentialSavings} kr/mån*
⚡️ Förbrukning: ${lead.billData.totalKWh} kWh
📊 Confidence: ${Math.round(lead.billData.confidence * 100)}%

🕒 ${new Date(lead.createdAt).toLocaleString("sv-SE")}
  `.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown"
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    console.log("[telegram] Notis skickad för lead:", lead.id);
  } catch (error) {
    console.error("[telegram] Kunde inte skicka notis:", error);
  }
}

