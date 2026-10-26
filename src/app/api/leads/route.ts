import { NextRequest, NextResponse } from "next/server";
import { Lead, BillData, SavingsCalculation } from "@/lib/types";
import { createDatabaseFromBinding } from "@/lib/database";
import { addToNewsletter, getDefaultNewsletterGroupId } from "@/lib/email";
import { isTelegramConfigured, sendTelegramMessage, escapeMarkdown } from "@/lib/telegram";
import { requireAdmin } from "@/lib/admin-auth";
import { validatePhone } from "@/lib/validate-phone";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

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
    const body = await req.json() as { email?: string; phone?: string; billData?: BillData; savings?: SavingsCalculation; subscribeNewsletter?: boolean; name?: string; type?: "analysis" | "interest"; interest?: string };
    const { email, phone, billData, savings, subscribeNewsletter, name, interest } = body;
    // Saknas type behandlas leaden som en analys (bakåtkompatibelt med befintliga anrop).
    const leadType: "analysis" | "interest" = body.type === "interest" ? "interest" : "analysis";
    
    console.log("[leads] POST request received:", { email, phone, hasBillData: !!billData, hasSavings: !!savings });

    // Validera input
    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "E-post eller telefon krävs" },
        { status: 400 }
      );
    }

    // Rimlighetskontroll av telefonnumret. Ett nummer vi inte kan ringa är ingen lead —
    // och påhittade nummer (070000000) ska inte bli notiser eller statistik.
    if (phone && phone.trim()) {
      const kontroll = validatePhone(phone);
      if (!kontroll.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Telefonnumret verkar felaktigt (${kontroll.reason}). Kontrollera numret och försök igen.`,
          },
          { status: 400 }
        );
      }
    }

    // En analyslead måste ha fakturadata. En intresseanmälan har ingen faktura —
    // tidigare skickade avtals-sidan en påhittad exempelfaktura hit, vilket gjorde
    // att notisen visade 400 kWh / 80 % / 0 kr som om det vore kundens siffror.
    if (leadType === "analysis" && (!billData || !savings)) {
      return NextResponse.json(
        { success: false, error: "BillData och savings krävs för en analys" },
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
      type: leadType,
      interest: interest || "",
      billData,
      savings,
      status: "new" as const
    };

    console.log("[leads] Creating lead with data:", leadData);
    const lead = await db.createLead(leadData);
    console.log("[leads] Ny lead skapad:", lead.id);

    // Lägg till i nyhetsbrev om begärt och e-post finns
    if (subscribeNewsletter && email) {
      console.log("[leads] subscribeNewsletter requested:", { email, name, subscribeNewsletter, group: getDefaultNewsletterGroupId() });
      try {
        await addToNewsletter({ email, name }, getDefaultNewsletterGroupId());
        console.log("[leads] Subscribed to newsletter:", email);
      } catch (e) {
        console.error("[leads] addToNewsletter failed:", e);
      }
    }

    // Skicka Telegram-notis
    if (isTelegramConfigured()) {
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
  // En intresseanmälan har ingen faktura och därför ingen besparing. Att visa
  // «0 kr/mån» för den såg ut som en analys utan åtgärd — det var fel.
  if (lead.type === "interest") {
    const rader = [
      "🔔 *Ny förfrågan från Elbespararen!*",
      "",
      `📧 Email: ${escapeMarkdown(lead.email || "Ej angiven")}`,
      `📱 Telefon: ${escapeMarkdown(lead.phone || "Ej angiven")}`,
    ];
    if (lead.interest) rader.push(`📄 Gäller: ${escapeMarkdown(lead.interest)}`);
    rader.push("", "ℹ️ Ingen faktura uppladdad — kunden vill bli kontaktad.", "", `🕒 ${new Date(lead.createdAt).toLocaleString("sv-SE")}`);

    try {
      await sendTelegramMessage(rader.join("\n").trim(), "Markdown");
      console.log("[telegram] Notis skickad för förfrågan:", lead.id);
    } catch (error) {
      console.error("[telegram] Kunde inte skicka notis:", error);
    }
    return;
  }

  // Analys: besparingen är summan av *sparbara* elhandelsavgifter (påslag,
  // månadsavgift, tillägg) inkl. moms. Noll betyder inte «trasigt» — det betyder
  // att analysen inte hittade något att spara. Tidigare skrevs alltid «0 kr/mån»,
  // vilket såg ut som en möjlighet utan åtgärd. Nu visas vad AI:n faktiskt hittade.
  const besparing = lead.savings?.potentialSavings ?? 0;
  const avgifter = (lead.billData?.extraFeesDetailed ?? [])
    .filter((f) => typeof f?.amount === "number" && f.amount !== 0)
    .slice(0, 6)
    .map((f) => `• ${escapeMarkdown(f.label)}: ${f.amount} kr`);

  const besparingsRad =
    besparing > 0
      ? `💰 Besparing: *${besparing} kr/mån*`
      : "💰 Besparing: *inga sparbara avgifter hittade*";

  const avgiftsBlock =
    avgifter.length > 0
      ? `\n📋 Avgifter AI:n hittade:\n${avgifter.join("\n")}`
      : "\n📋 Avgifter AI:n hittade: *inga* — räkningen innehöll bara nät, skatt och spot";

  const message = `
🔔 *Ny analys från Elbespararen!*

📧 Email: ${escapeMarkdown(lead.email || "Ej angiven")}
📱 Telefon: ${escapeMarkdown(lead.phone || "Ej angiven")}

${besparingsRad}
⚡️ Förbrukning: ${lead.billData?.totalKWh ?? "?"} kWh
📊 Confidence: ${Math.round((lead.billData?.confidence ?? 0) * 100)}%${avgiftsBlock}

🕒 ${new Date(lead.createdAt).toLocaleString("sv-SE")}
  `.trim();

  try {
    await sendTelegramMessage(message, "Markdown");
    console.log("[telegram] Notis skickad för lead:", lead.id);
  } catch (error) {
    console.error("[telegram] Kunde inte skicka notis:", error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as { 
      id: string; 
      status?: "new" | "contacted" | "converted" | "rejected";
      email?: string;
      phone?: string;
    };
    const { id, status, email, phone } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Lead ID krävs" },
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

    // Hämta befintlig lead
    const existing = await db.getLead(String(id));
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Lead hittades inte" },
        { status: 404 }
      );
    }

    // Bygg upp uppdatering
    const partial: Partial<Lead> = {};
    if (status) {
      partial.status = status;
    }
    if (email !== undefined) {
      partial.email = email;
    }
    if (phone !== undefined) {
      partial.phone = phone;
    }

    const updatedLead = await db.updateLead(String(id), partial);

    return NextResponse.json({
      success: true,
      data: updatedLead
    });
  } catch (error) {
    console.error("[leads] PUT error:", error);
    const message = error instanceof Error ? error.message : "Kunde inte uppdatera lead";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

