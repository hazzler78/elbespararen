import { NextRequest, NextResponse } from "next/server";
import { APP_CONFIG } from "@/lib/constants";
import { BillData } from "@/lib/types";
import { applyCorrections, validateBillData } from "@/lib/ai-corrections";
import { analyzeBillStructured, normalizeBillData } from "@/lib/bill-vision";
import { saveBillImage } from "@/lib/storage/bill-images";
import { calculateSavings } from "@/lib/calculations";
import { createDatabaseFromBinding } from "@/lib/database";
import {
  createAiClient,
  hasXaiApiKey,
} from "@/lib/ai-client";

function redactSecrets(message: string): string {
  return message
    .replace(/sk-[A-Za-z0-9_\-]{6,}/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 300);
}

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';
/** Real bills + Grok vision often need >30s on cold CF Workers */
export const maxDuration = 60;

/**
 * POST /api/parse-bill-v3
 * Analyserar elräkning med Grok Vision (xAI)
 */
export async function POST(
  req: NextRequest,
  context: any
) {
  try {
    if (!hasXaiApiKey()) {
      console.error("[parse-bill-v3] XAI_API_KEY saknas");
      return NextResponse.json(
        { success: false, error: "Kunde inte analysera fakturan" },
        { status: 500 }
      );
    }

    const openai = createAiClient({ timeoutMs: 60_000 });

    // Hämta fil(er) från FormData — stöd 1–3 sidor (file / files)
    const formData = await req.formData();
    const customPrompt = formData.get("prompt") as string;
    const postalCode = (formData.get("postalCode") as string | null) ?? undefined;
    const priceArea = (formData.get("priceArea") as string | null) ?? undefined;

    const rawFiles = [
      ...formData.getAll("file"),
      ...formData.getAll("files"),
    ].filter((entry): entry is File => entry instanceof File && entry.size > 0);

    // Deduplicate by name+size+lastModified in case both keys were sent
    const seen = new Set<string>();
    const files: File[] = [];
    for (const f of rawFiles) {
      const key = `${f.name}:${f.size}:${f.lastModified}`;
      if (seen.has(key)) continue;
      seen.add(key);
      files.push(f);
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Ingen fil uppladdad" },
        { status: 400 }
      );
    }

    if (files.length > APP_CONFIG.maxBillPages) {
      return NextResponse.json(
        { error: `Max ${APP_CONFIG.maxBillPages} sidor per analys` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > APP_CONFIG.maxFileSize) {
        return NextResponse.json(
          { error: `Filen ${file.name} är för stor. Max ${APP_CONFIG.maxFileSize / 1024 / 1024}MB per sida` },
          { status: 400 }
        );
      }
      if (!APP_CONFIG.acceptedFileTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Endast JPEG, PNG och WebP tillåts (PDF stöds inte — fotografera varje sida)" },
          { status: 400 }
        );
      }
    }

    const primaryFile = files[0];
    let savedImageResult: Awaited<ReturnType<typeof saveBillImage>> | null = null;

    const requestEnv: Record<string, unknown> | undefined =
      (typeof (globalThis as any).getRequestContext === "function"
        ? (globalThis as any).getRequestContext()?.env
        : undefined) ||
      context?.env ||
      (context as any)?.cloudflare?.env ||
      (globalThis as any)?.env ||
      (globalThis as any)?.CF_PAGES?.env;

    if (requestEnv) {
      console.log("[parse-bill-v3] request env keys:", Object.keys(requestEnv));
    } else {
      console.log("[parse-bill-v3] request env is undefined");
    }

    try {
      savedImageResult = await saveBillImage(primaryFile, { postalCode, priceArea }, { env: requestEnv });
      console.log(`[parse-bill-v3] Faktura sparad: ${savedImageResult.key} (${savedImageResult.storage})`);
    } catch (storageError) {
      console.error("[parse-bill-v3] Kunde inte spara fakturabild:", storageError);
      savedImageResult = null;
    }

    // Konvertera alla sidor till data URLs för vision
    const dataUrls: string[] = [];
    for (const file of files) {
      const arrayBuffer =
        savedImageResult && file === primaryFile
          ? savedImageResult.arrayBuffer
          : await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      dataUrls.push(`data:${file.type};base64,${buffer.toString("base64")}`);
    }

    console.log(
      `[parse-bill-v3] Analyserar ${files.length} sida(or):`,
      files.map((f) => `${f.name} (${f.type}, ${(f.size / 1024).toFixed(1)}KB)`).join(", ")
    );

    // One structured vision call first (faster/more reliable than identify+analyze).
    console.log(`[parse-bill-v3] Analyserar med Grok Vision (structured, ${dataUrls.length} bild(er))...`);
    let billData: BillData;

    try {
      billData = await analyzeBillStructured(openai, dataUrls, customPrompt);
    } catch (structuredError) {
      // One more single-shot call only — never identify+analyze (2× vision ≈ 2+ min).
      console.warn(
        `[parse-bill-v3] Structured vision misslyckades, fallback till generalAI (1 anrop):`,
        structuredError
      );
      try {
        const { generalAI } = await import("@/lib/ai-general");
        // generalAI is single-image; use first page as best-effort fallback
        billData = normalizeBillData(await generalAI.analyze(dataUrls[0]));
      } catch (fallbackError) {
        const structuredMsg =
          structuredError instanceof Error ? structuredError.message : String(structuredError);
        const fallbackMsg =
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        throw new Error(
          `Vision-analys misslyckades (${structuredMsg}). Fallback: ${fallbackMsg}`
        );
      }
    }

    // Tillämpa AI-korrektioner för att fixa kända problem
    console.log(`[parse-bill-v3] Tillämpar AI-korrektioner...`);
    billData = applyCorrections(normalizeBillData(billData));

    // Validera att extraFeesDetailed summerar till extraFeesTotal
    const calculatedTotal = (billData.extraFeesDetailed || []).reduce(
      (sum, fee) => sum + fee.amount,
      0
    );

    // Tolerans för avrundningsfel
    const tolerance = 0.01;
    if (Math.abs(calculatedTotal - billData.extraFeesTotal) > tolerance) {
      console.warn(
        `[parse-bill-v3] Summan av extra avgifter matchar inte: ${calculatedTotal} vs ${billData.extraFeesTotal}`
      );
      // Justera till beräknad summa
      billData.extraFeesTotal = Math.round(calculatedTotal * 100) / 100;
    }

    // Validera slutresultatet
    const validation = validateBillData(billData);
    if (!validation.isValid) {
      console.warn(`[parse-bill-v3] Valideringsvarningar:`, validation.warnings);
    }

    console.log(`[parse-bill-v3] Analys klar. Confidence: ${(billData.confidence * 100).toFixed(0)}%`);
    console.log(`[parse-bill-v3] Elnät: ${billData.elnatCost} kr, Elhandel: ${billData.elhandelCost} kr, Extra: ${billData.extraFeesTotal} kr`);
    console.log(`[parse-bill-v3] Total belopp: ${billData.totalAmount} kr`);
    console.log(`[parse-bill-v3] Extra avgifter detalj:`, JSON.stringify(billData.extraFeesDetailed, null, 2));
    console.log(`[parse-bill-v3] Period: ${billData.period}, Förbrukning: ${billData.totalKWh} kWh, Avtalstyp: ${billData.contractType}`);

    if (postalCode && !billData.postalCode) {
      billData.postalCode = postalCode;
    }

    if (priceArea && !billData.priceArea) {
      billData.priceArea = priceArea;
    }

    if (savedImageResult) {
      billData.imageKey = savedImageResult.key;
      billData.imageUrl = savedImageResult.url;
      billData.originalFileName =
        files.length > 1
          ? `${primaryFile.name} (+${files.length - 1} sida${files.length > 2 ? "or" : ""})`
          : primaryFile.name;
      billData.uploadedAt = savedImageResult.uploadedAt;
    }

    // Beräkna besparingar
    const savings = calculateSavings(billData);

    // Spara analys i databasen för admin-granskning
    let dbSaveSuccess = false;
    let dbSaveError: string | null = null;
    let accountSaveBlocked = false;
    let accountSaveLimit: number | undefined = undefined;
    
    try {
      // Hämta D1-binding från Edge-runtime
      let env: any = {};
      if ((globalThis as any).getRequestContext) {
        env = (globalThis as any).getRequestContext()?.env ?? {};
      }
      if (!env.DB && (process.env as any).DB) {
        env.DB = (process.env as any).DB;
      }
      if (!env.DB && (globalThis as any).env?.DB) {
        env.DB = (globalThis as any).env.DB;
      }

      console.log(`[parse-bill-v3] DB binding exists:`, !!env?.DB);
      console.log(`[parse-bill-v3] DB binding type:`, env?.DB ? typeof env.DB : 'none');

      const db = createDatabaseFromBinding(env?.DB);
      console.log(`[parse-bill-v3] Database type:`, db.constructor.name);
      
      // Hämta IP-adress och user agent från request headers
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                        req.headers.get('x-real-ip') || 
                        'unknown';
      const userAgent = req.headers.get('user-agent') || undefined;

      console.log(`[parse-bill-v3] Försöker spara analys i databasen...`);
      
      // Hämta användare om inloggad — gratis max 2 sparade på kontot
      let userId: string | undefined = undefined;
      try {
        const { getSessionUser } = await import("@/lib/auth");
        const { canSaveAnalysisToAccount } = await import("@/lib/premium");
        const user = await getSessionUser(req);
        if (user?.email) {
          console.log(`[parse-bill-v3] User authenticated: ${user.email}`);
          const dbUser = await db.createOrUpdateUser({
            email: user.email,
            name: user.name,
            image: user.image,
          });
          const existing = await db.getBillAnalysesByUserId(dbUser.id, "all");
          const gate = canSaveAnalysisToAccount(dbUser, existing.length);
          if (gate.allowed) {
            userId = dbUser.id;
            console.log(`[parse-bill-v3] User ID set: ${userId} (saved=${existing.length}, limit=${gate.limit})`);
          } else {
            accountSaveBlocked = true;
            accountSaveLimit = gate.limit;
            console.log(`[parse-bill-v3] Free save limit reached (${existing.length}/${gate.limit}) — saving without user_id`);
          }
        } else {
          console.log('[parse-bill-v3] No user found in session, saving without user_id');
        }
      } catch (authError) {
        // Ignore auth errors - user might not be logged in
        console.log('[parse-bill-v3] Auth error (user might not be logged in):', authError instanceof Error ? authError.message : String(authError));
      }
      
      const savedAnalysis = await db.createBillAnalysis({
        billData,
        savings,
        imageKey: billData.imageKey,
        imageUrl: billData.imageUrl,
        originalFileName: billData.originalFileName,
        postalCode: billData.postalCode,
        priceArea: billData.priceArea,
        aiConfidence: billData.confidence,
        aiWarnings: billData.warnings,
        validationStatus: 'pending',
        ipAddress,
        userAgent,
        userId
      });

      console.log(`[parse-bill-v3] ✅ Analys sparad i databasen för admin-granskning`);
      console.log(`[parse-bill-v3] Analysis ID: ${savedAnalysis.id}, User ID: ${userId || 'none (not logged in)'}${accountSaveBlocked ? ' [account save blocked]' : ''}`);
      dbSaveSuccess = true;
    } catch (dbError) {
      // Logga felet men fortsätt - analysen ska fortfarande returneras till användaren
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      dbSaveError = errorMessage;
      
      console.error("[parse-bill-v3] ❌ Kunde inte spara analys i databasen:", errorMessage);
      console.error("[parse-bill-v3] Error details:", dbError);
      
      // Om tabellen saknas, logga tydligt
      if (errorMessage.includes('no such table') || errorMessage.includes('bill_analyses')) {
        console.error("[parse-bill-v3] ⚠️ bill_analyses tabellen saknas! Kör migration 0032_create_bill_analyses.sql");
      }
    }

    return NextResponse.json({
      success: true,
      data: billData,
      meta: {
        fileName: primaryFile.name,
        fileSize: files.reduce((sum, f) => sum + f.size, 0),
        pageCount: files.length,
        timestamp: new Date().toISOString(),
        imageKey: savedImageResult?.key,
        storage: savedImageResult?.storage ?? "unknown",
        dbSaved: dbSaveSuccess,
        dbError: dbSaveError || undefined,
        accountSaved: dbSaveSuccess && !accountSaveBlocked,
        accountSaveBlocked: accountSaveBlocked || undefined,
        accountSaveLimit: accountSaveLimit,
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Okänt fel";
    console.error("[parse-bill-v3] Error:", redactSecrets(errorMessage));

    return NextResponse.json(
      {
        success: false,
        error: "Kunde inte analysera fakturan",
      },
      { status: 500 }
    );
  }
}

