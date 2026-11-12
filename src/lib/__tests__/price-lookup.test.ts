import {
  hasUsableLookupMarkup,
  markupKrMatchesOreExcl,
} from "../price-lookup";
import { markupKrInclVatToOreExcl, markupOreExclToKrInclVat } from "../variable-markup";

describe("price lookup helpers", () => {
  test("database-påslag går att runda tillbaka", () => {
    expect(markupKrInclVatToOreExcl(0.1349)).toBeCloseTo(10.792, 3);
    expect(markupKrMatchesOreExcl(0.1349, 10.792)).toBe(true);
  });

  test("hasUsableLookupMarkup skiljer unknown från database", () => {
    expect(hasUsableLookupMarkup({ source: "unknown" })).toBe(false);
    expect(hasUsableLookupMarkup({ source: "unknown", surcharge: 0 })).toBe(false);
    expect(hasUsableLookupMarkup({ source: "database", surcharge: 10.79 })).toBe(true);
    expect(hasUsableLookupMarkup({ source: "live", surcharge: 0 })).toBe(true);
  });

  test("Fortum, Tibber och Skellefteå Kraft db-värden", () => {
    const cases = [
      { name: "Fortum", kr: 0.1349 },
      { name: "Tibber", kr: 0.119 },
      { name: "Skellefteå Kraft", kr: 0.075 },
    ];
    for (const { kr } of cases) {
      const ore = markupKrInclVatToOreExcl(kr);
      expect(markupOreExclToKrInclVat(ore)).toBeCloseTo(kr, 6);
    }
  });
});
