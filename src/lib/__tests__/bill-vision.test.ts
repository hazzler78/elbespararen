import { normalizeBillData, parseJsonFromModelContent } from "@/lib/bill-vision";

describe("bill-vision", () => {
  it("parses markdown-wrapped JSON", () => {
    expect(parseJsonFromModelContent('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("normalizes partial AI payloads", () => {
    const bill = normalizeBillData({ totalAmount: 500 });
    expect(bill.totalAmount).toBe(500);
    expect(bill.extraFeesDetailed).toEqual([]);
    expect(bill.contractType).toBe("rörligt");
    expect(bill.confidence).toBe(0);
  });
});
