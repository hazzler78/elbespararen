/**
 * Telegram notification utility with support for multiple recipients.
 */

/**
 * Returns list of chat IDs from TELEGRAM_CHAT_IDS or single TELEGRAM_CHAT_ID.
 */
export function getTelegramChatIds(): string[] {
  const ids = (process.env.TELEGRAM_CHAT_IDS || "").trim();
  if (ids) {
    return ids
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = (process.env.TELEGRAM_CHAT_ID || "").trim();
  return single ? [single] : [];
}

/**
 * Returns true if bot token and at least one chat id is configured.
 */
export function isTelegramConfigured(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN && getTelegramChatIds().length > 0;
}

/**
 * Sends a Telegram message to all configured chat ids. Defaults to Markdown parse mode.
 */
export async function sendTelegramMessage(message: string, parseMode: "Markdown" | "HTML" | undefined = "Markdown"): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getTelegramChatIds();

  if (!botToken || chatIds.length === 0) {
    throw new Error("Telegram not configured: missing bot token or chat ids");
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // Send in parallel to keep latency low for small recipient lists
  const responses = await Promise.all(
    chatIds.map(async (chatId) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: parseMode })
      });
      return { chatId, ok: res.ok, status: res.status };
    })
  );

  const failed = responses.filter((r) => !r.ok);
  if (failed.length > 0) {
    const codes = failed.map((f) => `${f.chatId}:${f.status}`).join(", ");
    throw new Error(`Telegram API error for chat ids: ${codes}`);
  }
}

/**
 * Escapes special characters for Telegram Markdown (v1) to avoid formatting issues.
 * Note: We keep using Markdown (not MarkdownV2) for compatibility with existing messages.
 */
export function escapeMarkdown(input: string): string {
  if (!input) return "";
  // Escape characters that have special meaning in Telegram Markdown
  return input
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/`/g, "\\`")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}


