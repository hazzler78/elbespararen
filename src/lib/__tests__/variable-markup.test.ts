import { fullEnergyAdderKrInclVat, markupOreExclToKrInclVat } from "../variable-markup";

describe("rörligt påslag", () => {
  test("Svekrafts påslag 0,19 öre exkl. moms blir 0,2375 öre inkl. moms", () => {
    expect(markupOreExclToKrInclVat(0.19)).toBe(0.002375);
  });

  test("Cheap Energy 0,39 och Stockholm 0,29 följer samma moms", () => {
    expect(markupOreExclToKrInclVat(0.39)).toBe(0.004875);
    expect(markupOreExclToKrInclVat(0.29)).toBe(0.003625);
  });

  test("negativt påslag behålls", () => {
    expect(markupOreExclToKrInclVat(-1.36)).toBe(-0.017);
  });

  test("påslaget är inte hela tillägget", () => {
    const paslag = markupOreExclToKrInclVat(0.19);
    const allt = fullEnergyAdderKrInclVat({
      markupOreExcl: 0.19,
      variableCostsOreExcl: 13.9,
      discountOreExcl: 0,
    });
    expect(paslag).toBe(0.002375);
    expect(allt).toBe(0.176125);
    expect(allt).not.toBe(paslag);
  });

  test("rabatt sänker kostnadstillägget men inte påslagsfältet", () => {
    const paslag = markupOreExclToKrInclVat(0.39);
    const allt = fullEnergyAdderKrInclVat({
      markupOreExcl: 0.39,
      variableCostsOreExcl: 11.15,
      discountOreExcl: -15.99,
    });
    expect(paslag).toBe(0.004875);
    expect(allt).toBe(-0.055625);
  });
});
