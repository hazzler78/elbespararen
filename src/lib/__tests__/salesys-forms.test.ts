import {
  buildSalesysEmbedUrl,
  ELBESPARAREN_KALLA,
  getSalesysFormForProvider,
  resolveSalesysKalla,
  SALESYS_EMBED_ORIGIN,
} from "@/lib/salesys-forms";

describe("salesys-forms", () => {
  it("resolves Cheap Energy form with field ids", () => {
    const form = getSalesysFormForProvider("Cheap Energy");
    expect(form?.formId).toBe("68ab2b2a4d638f9c685d2877");
    expect(form?.kallaFieldId).toBe("66e9452c20ef2d3b8c66f4fc");
    expect(form?.cookieFieldId).toBe("693c095ee03b5aceecefd87a");
    expect(form?.signupUrl).toContain("src=Elbespararen");
  });

  it("resolves the other partner forms, including name variants", () => {
    expect(getSalesysFormForProvider("Stockholms Elbolag")?.formId).toBe(
      "68ab2b084d638f9c685d27ac"
    );
    expect(getSalesysFormForProvider("Stockholms El")?.label).toBe(
      "Stockholms Elbolag"
    );
    expect(getSalesysFormForProvider("Svealands Elbolag")?.formId).toBe(
      "68ab2af84d638f9c685d2768"
    );
    expect(getSalesysFormForProvider("Svea")?.label).toBe("Svealands Elbolag");
    expect(getSalesysFormForProvider("Svealands EL")?.label).toBe(
      "Svealands Elbolag"
    );
    expect(getSalesysFormForProvider("Energi2")?.formId).toBe(
      "68ab2b3e4d638f9c685d2942"
    );
    expect(getSalesysFormForProvider("Energi 2")?.label).toBe("Energi2");
    expect(getSalesysFormForProvider("Svekraft")?.formId).toBe(
      "68ab2b1e4d638f9c685d2833"
    );
    expect(getSalesysFormForProvider("Motala Energi")?.formId).toBe(
      "68ab2b344d638f9c685d28f8"
    );
    expect(getSalesysFormForProvider("Motala El")?.label).toBe("Motala Energi");
  });

  it("does not treat unrelated providers as partner forms", () => {
    for (const name of [
      "Eon",
      "Fortum",
      "Tibber",
      "Bixia",
      "Ellevio",
      "Telinet",
      "Skellefteå Kraft",
      "Energi",
      "",
    ]) {
      expect(getSalesysFormForProvider(name)).toBeNull();
    }
  });

  it("keeps Svekraft and a Cheap Energy suffix on the right form", () => {
    expect(getSalesysFormForProvider("Svekraft")?.label).toBe("Svekraft");
    expect(getSalesysFormForProvider("Cheap Energy Rörligt")?.formId).toBe(
      "68ab2b2a4d638f9c685d2877"
    );
  });

  it("reads src from attribution referrer", () => {
    expect(
      resolveSalesysKalla(
        "https://www.cheapenergy.se/teckna-elavtal/?src=Elbespararen"
      )
    ).toBe("Elbespararen");
    expect(resolveSalesysKalla("https://example.com/")).toBe(ELBESPARAREN_KALLA);
    expect(resolveSalesysKalla()).toBe(ELBESPARAREN_KALLA);
  });

  it("builds skaffa embed URL with referrer + cache bust", () => {
    const url = buildSalesysEmbedUrl(
      "68ab2b2a4d638f9c685d2877",
      "https://www.cheapenergy.se/teckna-elavtal/?src=Elbespararen"
    );
    expect(url.startsWith(`${SALESYS_EMBED_ORIGIN}/68ab2b2a4d638f9c685d2877?`)).toBe(
      true
    );
    expect(url).toContain("referrer=");
    expect(url).toContain("t=");
  });

  it("uses the brand signup page when the provider has no affiliate URL", () => {
    const url = buildSalesysEmbedUrl(
      "68ab2b3e4d638f9c685d2942",
      undefined,
      "https://energi2.se/teckna-elavtal/?src=Elbespararen"
    );
    expect(url).toContain(
      encodeURIComponent("https://energi2.se/teckna-elavtal/?src=Elbespararen")
    );
  });
});
