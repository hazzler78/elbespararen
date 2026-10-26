import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import { getEnvVar } from "@/lib/admin-auth";
import {
  getOtovoConfig,
  mapOtovoResultToDbStatus,
  parseYearlyConsumptionKwh,
  submitOtovoInterest,
} from "@/lib/otovo";
import { isTelegramConfigured, sendTelegramMessage, escapeMarkdown } from "@/lib/telegram";
import { validatePhone } from "@/lib/validate-phone";
import type { SolarLead, SolarLeadSource } from "@/lib/types";

export const runtime = "edge";

function getCloudflareEnv(): Record<string, unknown> {
  let env: Record<string, unknown> = {};

  if ((globalThis as any).getRequestContext) {
    env = (globalThis as any).getRequestContext()?.env ?? {};
  }

  if (!env.DB && (process.env as any).DB) {
    env.DB = (process.env as any).DB;
  }

  if (!env.DB && (globalThis as any).env?.DB) {
    env.DB = (globalThis as any).env.DB;
  }

  return env;
}

async function sendSolarLeadTelegram(lead: SolarLead) {
  const otovoLine =
    lead.otovoStatus === "success"
      ? `✅ Otovo: skickad (ID: ${escapeMarkdown(lead.otovoInterestId || "—")})`
      : `⚠️ Otovo: ${escapeMarkdown(lead.otovoStatus)}${lead.otovoError ? ` — ${escapeMarkdown(lead.otovoError.slice(0, 200))}` : ""}`;

  const message = `
☀️ *Ny solcells-intresseanmälan*

👤 ${escapeMarkdown(lead.name)}
📧 ${escapeMarkdown(lead.email)}
📞 ${escapeMarkdown(lead.phone)}
🏙️ ${escapeMarkdown(lead.city)}
${lead.address ? `📍 ${escapeMarkdown(lead.address)}\n` : ""}${lead.yearlyConsumptionKwh ? `⚡ ${lead.yearlyConsumptionKwh} kWh/år\n` : ""}${lead.message ? `\n📝 ${escapeMarkdown(lead.message)}\n` : ""}
📍 Källa: ${escapeMarkdown(lead.source)}
${otovoLine}

🆔 Lead-ID: ${escapeMarkdown(lead.id)}
🕒 ${escapeMarkdown(lead.createdAt.toLocaleString("sv-SE"))}
`.trim();

  await sendTelegramMessage(message, "Markdown");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      city?: string;
      address?: string;
      consumption?: string;
      message?: string;
      consentOtovo?: boolean;
      source?: SolarLeadSource;
      utmId?: string;
    };

    const name = body.name?.trim() || "";
    const email = body.email?.trim() || "";
    const phone = body.phone?.trim() || "";
    const city = body.city?.trim() || "";
    const address = body.address?.trim() || "";
    const source: SolarLeadSource = body.source === "result" ? "result" : "homepage";

    if (!name || !email || !phone || !city) {
      return NextResponse.json(
        { success: false, error: "Namn, e-post, telefon och stad krävs" },
        { status: 400 }
      );
    }

    if (!body.consentOtovo) {
      return NextResponse.json(
        {
          success: false,
          error: "Du måste godkänna att uppgifterna delas med Otovo för att få en offert",
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Ogiltig e-postadress" },
        { status: 400 }
      );
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Telefonnumret verkar felaktigt (${phoneCheck.reason}). Kontrollera numret och försök igen.`,
        },
        { status: 400 }
      );
    }

    const yearlyConsumptionKwh = parseYearlyConsumptionKwh(body.consumption);
    const env = getCloudflareEnv();
    const db = createDatabaseFromBinding(env?.DB);

    let lead = await db.createSolarLead({
      name,
      email,
      phone,
      city,
      address,
      yearlyConsumptionKwh,
      message: body.message?.trim() || undefined,
      source,
      utmId: body.utmId?.trim() || undefined,
      otovoStatus: "pending",
    });

    const otovoConfig = getOtovoConfig(getEnvVar);
    const otovoResult = await submitOtovoInterest(
      {
        name,
        email,
        phone,
        city,
        address,
        consumption: body.consumption,
        utmId: body.utmId,
      },
      otovoConfig
    );

    const mapped = mapOtovoResultToDbStatus(otovoResult);
    lead = await db.updateSolarLeadOtovo(lead.id, {
      otovoStatus: mapped.otovoStatus as SolarLead["otovoStatus"],
      otovoInterestId: mapped.otovoInterestId ?? null,
      otovoError: mapped.otovoError ?? null,
    });

    if (isTelegramConfigured()) {
      try {
        await sendSolarLeadTelegram(lead);
      } catch (error) {
        console.error("[solar-lead] Telegram notification failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: lead.id,
        otovoStatus: lead.otovoStatus,
      },
      message:
        lead.otovoStatus === "success"
          ? "Tack! Vår solcellspartner kontaktar dig inom kort."
          : "Tack! Vi har tagit emot din förfrågan.",
    });
  } catch (error) {
    console.error("[solar-lead] POST error:", error);
    const errorMessage = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { success: false, error: `Kunde inte skicka förfrågan: ${errorMessage}` },
      { status: 500 }
    );
  }
}
