import { getPriceAreaFromPostalCode } from "@/lib/price-areas";

describe("getPriceAreaFromPostalCode", () => {
  it("returns SE3 for Stockholm-area postal codes", () => {
    expect(getPriceAreaFromPostalCode("18660")).toBe("se3");
    expect(getPriceAreaFromPostalCode("11120")).toBe("se3");
    expect(getPriceAreaFromPostalCode("43266")).toBe("se3");
  });

  it("handles southern Sweden as SE4", () => {
    expect(getPriceAreaFromPostalCode("21133")).toBe("se4");
    expect(getPriceAreaFromPostalCode("35236")).toBe("se4");
  });

  it("returns SE2 for northern mid-Sweden", () => {
    expect(getPriceAreaFromPostalCode("85232")).toBe("se2");
    expect(getPriceAreaFromPostalCode("87145")).toBe("se2");
  });

  it("maps northernmost Sweden to SE1", () => {
    expect(getPriceAreaFromPostalCode("98132")).toBe("se1");
    expect(getPriceAreaFromPostalCode("98431")).toBe("se1");
  });

  it("falls back to SE3 for invalid postal codes", () => {
    expect(getPriceAreaFromPostalCode("12A45")).toBe("se3");
    expect(getPriceAreaFromPostalCode("")).toBe("se3");
  });
});

