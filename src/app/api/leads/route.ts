import { NextRequest, NextResponse } from "next/server";
import { Lead } from "@/lib/types";

// TODO: Integrera med databas (PostgreSQL/Supabase/etc)
// För nu returnerar vi en mockad lista

export async function GET() {
  try {
    // TODO: Hämta från databas
    const leads: Lead[] = [];
    
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
    const body = await req.json();
    const { email, phone, billData, savings } = body;

    // Validera input
    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "E-post eller telefon krävs" },
        { status: 400 }
      );
    }

    // Skapa lead-objekt
    const lead: Lead = {
      id: crypto.randomUUID(),
      email,
      phone,
      billData,
      savings,
      createdAt: new Date(),
      status: "new"
    };

    console.log("[leads] Ny lead skapad:", lead.id);

    // TODO: Spara till databas
    // await db.leads.create(lead);

    // TODO: Skicka Telegram-notis
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await sendTelegramNotification(lead);
    }

    return NextResponse.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error("[leads] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte skapa lead" },
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

