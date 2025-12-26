import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BILL_SCHEMA } from "@/lib/schema";
import { SYSTEM_PROMPT, OPENAI_CONFIG, APP_CONFIG } from "@/lib/constants";
import { BillData } from "@/lib/types";
import { applyCorrections, validateBillData } from "@/lib/ai-corrections";
import { providerRouter } from "@/lib/ai-provider-routing";
import { saveBillImage } from "@/lib/storage/bill-images";
import { calculateSavings } from "@/lib/calculations";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';
export const maxDuration = 30;

/**
 * POST /api/parse-bill-v3
 * Analyserar elräkning med OpenAI Vision
 */
export async function POST(
  req: NextRequest,
  context: any
) {
  try {
    // Validera API-nyckel
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API-nyckel saknas" },
        { status: 500 }
      );
    }

    // Initiera OpenAI client (runtime, inte build-time)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Hämta fil från FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const customPrompt = formData.get("prompt") as string;
    const postalCode = (formData.get("postalCode") as string | null) ?? undefined;
    const priceArea = (formData.get("priceArea") as string | null) ?? undefined;

    if (!file) {
      return NextResponse.json(
        { error: "Ingen fil uppladdad" },
        { status: 400 }
      );
    }

    // Validera filstorlek
    if (file.size > APP_CONFIG.maxFileSize) {
      return NextResponse.json(
        { error: `Filen är för stor. Max ${APP_CONFIG.maxFileSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validera filtyp
    if (!APP_CONFIG.acceptedFileTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Endast JPEG, PNG och WebP tillåts" },
        { status: 400 }
      );
    }

    let savedImageResult: Awaited<ReturnType<typeof saveBillImage>> | null = null;
    let arrayBuffer: ArrayBuffer;

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
      savedImageResult = await saveBillImage(file, { postalCode, priceArea }, { env: requestEnv });
      arrayBuffer = savedImageResult.arrayBuffer;
      console.log(`[parse-bill-v3] Faktura sparad: ${savedImageResult.key} (${savedImageResult.storage})`);
    } catch (storageError) {
      console.error("[parse-bill-v3] Kunde inte spara fakturabild:", storageError);
      arrayBuffer = await file.arrayBuffer();
      savedImageResult = null;
    }

    // Konvertera fil till Base64
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    console.log(`[parse-bill-v3] Analyserar fil: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`);

    // Använd ny provider routing system
    console.log(`[parse-bill-v3] Använder provider routing system...`);
    let billData: BillData;
    
    try {
      billData = await providerRouter.routeToProvider(dataUrl);
    } catch (routingError) {
      console.warn(`[parse-bill-v3] Provider routing misslyckades, fallback till generell AI:`, routingError);
      
      // Fallback till original AI-logik
      const promptToUse = customPrompt || SYSTEM_PROMPT;
      const response = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [
          {
            role: "system",
            content: promptToUse
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analysera denna svenska elfaktura visuellt och textmässigt. Identifiera alla kostnader och hitta extra avgifter som kunden kan undvika genom att byta leverantör. Fokusera på strukturell analys av alla kostnader."
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "bill_analysis",
            strict: true,
            schema: BILL_SCHEMA
          }
        },
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: OPENAI_CONFIG.maxTokens
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Tom respons från OpenAI");
      }
      billData = JSON.parse(content);
    }

    // Tillämpa AI-korrektioner för att fixa kända problem
    console.log(`[parse-bill-v3] Tillämpar AI-korrektioner...`);
    billData = applyCorrections(billData);

    // Validera att extraFeesDetailed summerar till extraFeesTotal
    const calculatedTotal = billData.extraFeesDetailed.reduce(
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
      billData.originalFileName = file.name;
      billData.uploadedAt = savedImageResult.uploadedAt;
    }

    // Beräkna besparingar
    const savings = calculateSavings(billData);

    // Spara analys i databasen för admin-granskning
    let dbSaveSuccess = false;
    let dbSaveError: string | null = null;
    
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
      await db.createBillAnalysis({
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
        userAgent
      });

      console.log(`[parse-bill-v3] ✅ Analys sparad i databasen för admin-granskning`);
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
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString(),
        imageKey: savedImageResult?.key,
        storage: savedImageResult?.storage ?? "unknown",
        dbSaved: dbSaveSuccess,
        dbError: dbSaveError || undefined
      }
    });

  } catch (error) {
    console.error("[parse-bill-v3] Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Okänt fel";
    
    return NextResponse.json(
      {
        success: false,
        error: "Kunde inte analysera fakturan",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

