/**
 * xAI / Grok client (OpenAI-compatible SDK).
 * Prefer XAI_API_KEY; OPENAI_API_KEY is accepted as a temporary fallback.
 * Reads Cloudflare Pages bindings via getRequestContext (same pattern as Stripe).
 */
import OpenAI from "openai";

export const XAI_BASE_URL = "https://api.x.ai/v1";

const DEFAULT_CHAT_MODEL = "grok-4.3";
/**
 * Bill OCR needs speed, not deep reasoning.
 * grok-4.7 defaults to reasoning_effort=high (cannot disable) → often 45–90s+ per image.
 * grok-4.3 supports reasoning_effort=none and is the right fit for structured invoice extraction.
 */
const DEFAULT_VISION_MODEL = "grok-4.3";

function getEnvVar(key: string): string | undefined {
  const fromProcess = (process.env as Record<string, string | undefined>)?.[key];
  if (typeof fromProcess === "string" && fromProcess.length > 0) return fromProcess;

  try {
    const ctxEnv = (globalThis as any).getRequestContext?.()?.env;
    if (ctxEnv && typeof ctxEnv[key] === "string" && ctxEnv[key]) {
      return ctxEnv[key] as string;
    }
  } catch {
    // ignore
  }

  try {
    const workerEnv = (globalThis as any).env;
    if (workerEnv && typeof workerEnv[key] === "string" && workerEnv[key]) {
      return workerEnv[key] as string;
    }
  } catch {
    // ignore
  }

  return undefined;
}

/** Chat: cheaper/fast enough for short widget replies */
export function getChatModel(): string {
  return getEnvVar("XAI_CHAT_MODEL") || DEFAULT_CHAT_MODEL;
}

/** Vision / bill OCR: fast model with image understanding */
export function getVisionModel(): string {
  return getEnvVar("XAI_VISION_MODEL") || DEFAULT_VISION_MODEL;
}

/**
 * Extra chat-completions fields for vision OCR latency.
 * grok-4.3: reasoning can be fully disabled. Newer flagships ignore/reject "none".
 */
export function getVisionReasoningParams(model = getVisionModel()): Record<string, string> {
  const id = model.toLowerCase();
  // Only 4.3 (and older aliases) accept "none". 4.5+ cannot disable reasoning.
  if (id.includes("4.7") || id.includes("4.6") || id.includes("4.5")) {
    return { reasoning_effort: "low" };
  }
  return { reasoning_effort: "none" };
}

/** @deprecated prefer getChatModel() — kept for call sites that need a string at import time */
export const AI_CHAT_MODEL = DEFAULT_CHAT_MODEL;

/** @deprecated prefer getVisionModel() */
export const AI_VISION_MODEL = DEFAULT_VISION_MODEL;

export function getXaiApiKey(): string | undefined {
  return getEnvVar("XAI_API_KEY") || getEnvVar("OPENAI_API_KEY");
}

export function hasXaiApiKey(): boolean {
  return Boolean(getXaiApiKey());
}

/** OpenAI SDK pointed at xAI */
export function createAiClient(options?: { timeoutMs?: number }): OpenAI {
  const apiKey = getXaiApiKey();
  if (!apiKey) {
    throw new Error("XAI_API_KEY saknas");
  }
  return new OpenAI({
    apiKey,
    baseURL: XAI_BASE_URL,
    timeout: options?.timeoutMs,
  });
}

export function getChatCompletionsUrl(): string {
  return `${XAI_BASE_URL}/chat/completions`;
}

export function getAiAuthHeaders(): Record<string, string> {
  const apiKey = getXaiApiKey();
  if (!apiKey) {
    throw new Error("XAI_API_KEY saknas");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}
