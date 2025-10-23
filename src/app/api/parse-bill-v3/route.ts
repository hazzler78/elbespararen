import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BILL_SCHEMA } from "@/lib/schema";
import { SYSTEM_PROMPT, OPENAI_CONFIG, APP_CONFIG } from "@/lib/constants";
import { BillData } from "@/lib/types";

// Node.js runtime för bättre filhantering
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/parse-bill-v3
 * Analyserar elräkning med OpenAI Vision
 */
export async function POST(req: NextRequest) {
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
        { error: "Endast JPEG, PNG, WebP och PDF tillåts" },
        { status: 400 }
      );
    }

    // Konvertera fil till Base64 (Node.js Runtime)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    console.log(`[parse-bill-v3] Analyserar fil: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`);
    console.log(`[parse-bill-v3] Data URL length: ${dataUrl.length} characters`);

    // Anropa OpenAI Vision med strukturerad output
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analysera denna svenska elfaktura visuellt och textmässigt. Hitta ALLA dolda avgifter och extra kostnader."
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

    // Parse JSON-svaret
    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("Tom respons från OpenAI");
    }

    const billData: BillData = JSON.parse(content);

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

    console.log(`[parse-bill-v3] Analys klar. Confidence: ${(billData.confidence * 100).toFixed(0)}%`);
    console.log(`[parse-bill-v3] Elnät: ${billData.elnatCost} kr, Elhandel: ${billData.elhandelCost} kr, Extra: ${billData.extraFeesTotal} kr`);
    console.log(`[parse-bill-v3] Total belopp: ${billData.totalAmount} kr`);
    console.log(`[parse-bill-v3] Extra avgifter detalj:`, JSON.stringify(billData.extraFeesDetailed, null, 2));
    console.log(`[parse-bill-v3] Period: ${billData.period}, Förbrukning: ${billData.totalKWh} kWh, Avtalstyp: ${billData.contractType}`);

    return NextResponse.json({
      success: true,
      data: billData,
      meta: {
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("[parse-bill-v3] Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Okänt fel";
    
    // Specifika felmeddelanden för olika typer av fel
    let userFriendlyError = "Kunde inte analysera fakturan";
    
    if (errorMessage.includes("rate limit")) {
      userFriendlyError = "AI:n är för tillfället överbelastad. Försök igen om en stund.";
    } else if (errorMessage.includes("timeout")) {
      userFriendlyError = "Analysen tog för lång tid. Försök igen med en mindre fil.";
    } else if (errorMessage.includes("invalid image")) {
      userFriendlyError = "Filen kunde inte läsas. Kontrollera att det är en giltig PDF eller bild.";
    } else if (errorMessage.includes("file too large")) {
      userFriendlyError = "Filen är för stor. Max storlek är 10MB.";
    }
    
    return NextResponse.json(
      {
        success: false,
        error: userFriendlyError,
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

