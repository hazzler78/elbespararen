import { messageForAnalysisFailure } from "@/lib/upload-analysis-error";

describe("messageForAnalysisFailure", () => {
  it("turns a provider or missing-key failure into Swedish without the upstream text", () => {
    const message = messageForAnalysisFailure({
      status: 500,
      error: "Kunde inte analysera fakturan",
      details: "Incorrect API key provided: sk-test-secret",
    });
    expect(message).toMatch(/Din faktura är kvar/);
    expect(message).not.toMatch(/sk-test/);
    expect(message).not.toMatch(/API key/i);
  });

  it("explains a non-JSON or gateway timeout", () => {
    expect(
      messageForAnalysisFailure({ status: 504, parseFailed: true })
    ).toMatch(/tog för lång tid eller svarade inte/);
  });

  it("keeps a safe validation message", () => {
    expect(
      messageForAnalysisFailure({
        status: 400,
        error: "Endast JPEG, PNG och WebP tillåts (PDF stöds inte — fotografera varje sida)",
      })
    ).toMatch(/JPEG, PNG och WebP/);
  });

  it("explains a dropped connection", () => {
    expect(messageForAnalysisFailure({ network: true })).toMatch(/Anslutningen avbröts/);
  });
});
