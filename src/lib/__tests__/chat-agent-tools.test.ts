import {
  extractNavigateActionsFromText,
  resolveAgentResponse,
  stripToolInvocationText,
} from "@/lib/chat-agent-tools";

describe("chat-agent-tools", () => {
  it("extracts navigate from Grok text hallucination", () => {
    const text =
      "Då tar jag dig till uppladdningen.\n\ninvoke navigate with path is /upload";
    expect(extractNavigateActionsFromText(text)).toEqual([
      { type: "navigate", path: "/upload" },
    ]);
  });

  it("strips invoke lines from reply", () => {
    const text =
      "Då tar jag dig till uppladdningen.\n\ninvoke navigate with path is /upload";
    expect(stripToolInvocationText(text)).toBe(
      "Då tar jag dig till uppladdningen."
    );
  });

  it("resolveAgentResponse prefers real tool_calls", () => {
    const resolved = resolveAgentResponse({
      content: "Då kör vi.\ninvoke navigate with path is /upload",
      toolCalls: [
        {
          type: "function",
          function: {
            name: "navigate",
            arguments: JSON.stringify({ path: "/result#byt-avtal" }),
          },
        },
      ],
    });
    expect(resolved.actions).toEqual([
      { type: "navigate", path: "/result#byt-avtal" },
    ]);
    expect(resolved.reply).toBe("Då kör vi.");
  });

  it("resolveAgentResponse falls back to text when no tool_calls", () => {
    const resolved = resolveAgentResponse({
      content:
        "Då tar jag dig till uppladdningen.\n\ninvoke navigate with path is /upload",
      toolCalls: [],
    });
    expect(resolved.actions).toEqual([{ type: "navigate", path: "/upload" }]);
    expect(resolved.reply).toBe("Då tar jag dig till uppladdningen.");
  });
});
