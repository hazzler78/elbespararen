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
    expect(form?.kallaFieldId).toBeTruthy();
    expect(form?.cookieFieldId).toBeTruthy();
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
});
