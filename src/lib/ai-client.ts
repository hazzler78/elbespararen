/**
 * xAI / Grok client (OpenAI-compatible SDK).
 * Prefer XAI_API_KEY; OPENAI_API_KEY is accepted as a temporary fallback
 * so existing Cloudflare env can be renamed gradually.
 */
import OpenAI from "openai";

export const XAI_BASE_URL = "https://api.x.ai/v1";

/** Chat: cheaper/fast enough for short widget replies */
export const AI_CHAT_MODEL =
  process.env.XAI_CHAT_MODEL || "grok-4.3";

/** Vision / bill OCR: flagship with image understanding */
export const AI_VISION_MODEL =
  process.env.XAI_VISION_MODEL || "grok-4.7";

export function getXaiApiKey(): string | undefined {
  return process.env.XAI_API_KEY || process.env.OPENAI_API_KEY;
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
