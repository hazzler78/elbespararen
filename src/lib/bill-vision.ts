/**
 * Single-shot Grok vision bill analysis (structured JSON).
 * Prefer this over multi-step provider routing — fewer round-trips, fewer timeouts.
 */
import type OpenAI from "openai";
import { BILL_SCHEMA } from "@/lib/schema";
import { SYSTEM_PROMPT, OPENAI_CONFIG } from "@/lib/constants";
import type { BillData } from "@/lib/types";
import { getVisionModel, getVisionReasoningParams, checkZeroDataRetention } from "@/lib/ai-client";

export function parseJsonFromModelContent(content: string): unknown {
  const cleaned = content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  return JSON.parse(cleaned);
}

/** Fill missing fields so corrections / calculateSavings never crash on partial AI output. */
export function normalizeBillData(raw: unknown): BillData {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<BillData>;
  const fees = Array.isArray(data.extraFeesDetailed) ? data.extraFeesDetailed : [];
  const contractType =
    data.contractType === "fast" || data.contractType === "rörligt"
      ? data.contractType
      : "rörligt";

  return {
    elnatCost: Number(data.elnatCost) || 0,
    elhandelCost: Number(data.elhandelCost) || 0,
    extraFeesTotal: Number(data.extraFeesTotal) || 0,
    extraFeesDetailed: fees.map((fee) => ({
      label: String(fee?.label || "Okänd avgift"),
      amount: Number(fee?.amount) || 0,
      confidence: Number(fee?.confidence) || 0.5,
    })),
    totalKWh: Number(data.totalKWh) || 0,
    period: String(data.period || ""),
    contractType,
    confidence: Number(data.confidence) || 0,
    warnings: Array.isArray(data.warnings) ? data.warnings.map(String) : [],
    totalAmount: Number(data.totalAmount) || 0,
    postalCode: data.postalCode,
    priceArea: data.priceArea,
    imageKey: data.imageKey,
    imageUrl: data.imageUrl,
    originalFileName: data.originalFileName,
    uploadedAt: data.uploadedAt,
  };
}

export async function analyzeBillStructured(
  client: OpenAI,
  dataUrlOrUrls: string | string[],
  customPrompt?: string | null
): Promise<BillData> {
  const model = getVisionModel();
  const dataUrls = (Array.isArray(dataUrlOrUrls) ? dataUrlOrUrls : [dataUrlOrUrls]).filter(
    (url) => typeof url === "string" && url.length > 0
  );
  if (dataUrls.length === 0) {
    throw new Error("Ingen bild att analysera");
  }

  const pageHint =
    dataUrls.length > 1
      ? `Du får ${dataUrls.length} sidor av samma svenska elfaktura. Läs ALLA sidor och sammanställ ett resultat (elnät, elhandel och extra avgifter kan ligga på olika sidor). Leta särskilt efter Rörliga kostnader, Fast påslag och Elavtal årsavgift på elhandelssidan.`
      : "Analysera denna svenska elfaktura. Om bara en sida syns: leta ändå efter Rörliga kostnader, Fast påslag och årsavgift under elhandel.";

  // Build params then cast once — xAI's reasoning_effort isn't in OpenAI SDK types yet,
  // and casting create()'s overload union makes `.choices` disappear from the return type.
  const params = {
    model,
    messages: [
      {
        role: "system" as const,
        content: customPrompt || SYSTEM_PROMPT,
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: `${pageHint} Identifiera alla kostnader och extra avgifter som går att undvika genom att byta elhandlare. Svara enligt schemat.`,
          },
          ...dataUrls.map((url) => ({
            type: "image_url" as const,
            image_url: {
              url,
              // "high" multiplies image tokens and latency; bills are readable at auto
              detail: "auto" as const,
            },
          })),
        ],
      },
    ],
    response_format: {
      type: "json_schema" as const,
      json_schema: {
        name: "bill_analysis",
        strict: true,
        schema: BILL_SCHEMA,
      },
    },
    temperature: OPENAI_CONFIG.temperature,
    max_tokens: OPENAI_CONFIG.maxTokens,
    stream: false as const,
    ...getVisionReasoningParams(model),
  };

  const { data: response, response: rawResponse } = await client.chat.completions
    .create(params as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming)
    .withResponse();
  checkZeroDataRetention(rawResponse.headers);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Tom respons från Grok Vision");
  }

  return normalizeBillData(parseJsonFromModelContent(content));
}
