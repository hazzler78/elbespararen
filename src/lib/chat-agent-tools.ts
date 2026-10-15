/**
 * Tools the Elbespararen chat agent may call.
 * Paths are allowlisted — never navigate to arbitrary URLs.
 */

export const AGENT_NAV_PATHS = [
  "/",
  "/upload",
  "/result",
  "/result#byt-avtal",
  "/contracts",
  "/premium",
  "/faq",
  "/contact",
  "/dashboard",
  "/auth/signin",
] as const;

export type AgentNavPath = (typeof AGENT_NAV_PATHS)[number];

export type AgentClientAction = {
  type: "navigate";
  path: AgentNavPath;
};

export const CHAT_AGENT_TOOLS: Array<{
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> = [
  {
    type: "function",
    function: {
      name: "navigate",
      description:
        "Navigera användaren till rätt sida på Elbespararen. Anropa detta verktyg via tools API — skriv aldrig tool-anrop som vanlig text i svaret.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            enum: [...AGENT_NAV_PATHS],
            description:
              "/upload = analysera faktura, /result#byt-avtal = byt elavtal, /contracts = jämför avtal, /premium = premium, /faq = frågor, /auth/signin = logga in",
          },
        },
        required: ["path"],
      },
    },
  },
];

function isAllowedPath(path: string): path is AgentNavPath {
  return (AGENT_NAV_PATHS as readonly string[]).includes(path);
}

/** Match paths that appear in free-text tool hallucinations */
const NAV_PATH_IN_TEXT =
  /\/(?:upload|result(?:#byt-avtal)?|contracts|premium|faq|contact|dashboard|auth\/signin)(?![a-z0-9/_-])/gi;

/** Lines that look like written-out tool calls (Grok sometimes does this) */
const TOOL_INVOCATION_LINE =
  /^\s*(?:invoke|call|tool(?:\s*call)?|function(?:\s*call)?|anropa)?\s*navigate\b.*$/gim;

/**
 * Recover navigate actions when the model writes tool calls as plain text
 * instead of using the tools API (e.g. "invoke navigate with path is /upload").
 */
export function extractNavigateActionsFromText(
  content: string | null | undefined
): AgentClientAction[] {
  if (!content) return [];

  const actions: AgentClientAction[] = [];
  const seen = new Set<string>();

  for (const match of content.matchAll(NAV_PATH_IN_TEXT)) {
    const raw = match[0];
    // Prefer hash variant when both could match — regex already includes #byt-avtal
    const path = raw as string;
    if (!isAllowedPath(path) || seen.has(path)) continue;
    seen.add(path);
    actions.push({ type: "navigate", path });
  }

  // Explicit "path is /upload" / path=/upload patterns (covers root "/")
  const pathAssign =
    /(?:path|to)\s*(?:is|=|:)\s*["']?(\/[a-z0-9#/_-]*)["']?/gi;
  for (const match of content.matchAll(pathAssign)) {
    const path = match[1];
    if (!path || !isAllowedPath(path) || seen.has(path)) continue;
    seen.add(path);
    actions.push({ type: "navigate", path });
  }

  return actions;
}

/** Remove hallucinated tool-invocation lines from assistant text */
export function stripToolInvocationText(content: string): string {
  return content
    .replace(TOOL_INVOCATION_LINE, "")
    .replace(
      /\b(?:invoke|call)\s+navigate\b[^\n.!?]*/gi,
      ""
    )
    .replace(/\bnavigate\s*\(\s*["']?\/[^"'\)]+["']?\s*\)/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Parse OpenAI-style tool_calls into safe client actions */
export function parseAgentToolCalls(
  toolCalls: ReadonlyArray<{
    type?: string;
    function?: { name?: string; arguments?: string };
  }> | null | undefined
): AgentClientAction[] {
  if (!toolCalls?.length) return [];

  const actions: AgentClientAction[] = [];
  for (const call of toolCalls) {
    // Newer OpenAI types include custom tool calls without `function`
    if (call.type && call.type !== "function") continue;
    if (call.function?.name !== "navigate") continue;
    try {
      const args = JSON.parse(call.function.arguments || "{}") as {
        path?: string;
      };
      if (args.path && isAllowedPath(args.path)) {
        actions.push({ type: "navigate", path: args.path });
      }
    } catch {
      // ignore malformed tool args
    }
  }
  return actions;
}

export function defaultReplyForActions(actions: AgentClientAction[]): string {
  const nav = actions.find((a) => a.type === "navigate");
  if (!nav) return "Okej — hur vill du gå vidare?";
  switch (nav.path) {
    case "/upload":
      return "Jag tar dig till uppladdningen nu.";
    case "/result#byt-avtal":
    case "/result":
      return "Jag tar dig till avtalsbytet nu.";
    case "/contracts":
      return "Jag öppnar avtalsjämförelsen.";
    case "/premium":
      return "Jag tar dig till Premium.";
    case "/faq":
      return "Jag öppnar vanliga frågor.";
    case "/auth/signin":
      return "Jag tar dig till inloggningen.";
    case "/dashboard":
      return "Jag öppnar din dashboard.";
    default:
      return "Jag tar dig dit nu.";
  }
}

/**
 * Merge API tool_calls with text-fallback navigation, and clean the reply.
 */
export function resolveAgentResponse(options: {
  content?: string | null;
  toolCalls?: ReadonlyArray<{
    type?: string;
    function?: { name?: string; arguments?: string };
  }> | null;
}): { reply: string; actions: AgentClientAction[] } {
  const fromTools = parseAgentToolCalls(options.toolCalls);
  const raw = options.content?.trim() || "";
  const fromText = fromTools.length ? [] : extractNavigateActionsFromText(raw);
  const actions = fromTools.length ? fromTools : fromText;

  let reply = stripToolInvocationText(raw);
  if (!reply && actions.length > 0) {
    reply = defaultReplyForActions(actions);
  }
  return { reply, actions };
}
