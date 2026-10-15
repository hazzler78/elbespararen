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
        "Navigera användaren till rätt sida på Elbespararen. Använd när nästa steg är en konkret handling (ladda upp faktura, byta avtal, FAQ, inloggning).",
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
