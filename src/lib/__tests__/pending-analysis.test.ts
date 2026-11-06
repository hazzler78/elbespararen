import { persistPendingAnalysis, shouldAutoOpenResult } from "@/lib/pending-analysis";
import { BillData } from "@/lib/types";

const bill = {
  elnatCost: 1,
  elhandelCost: 2,
  extraFeesTotal: 3,
  extraFeesDetailed: [],
  totalKWh: 10,
  period: "oktober 2026",
  contractType: "rörligt",
  confidence: 0.9,
  totalAmount: 750,
  priceArea: "se3",
} as BillData;

describe("pending analysis", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "pendingBillData=; path=/; max-age=0";
  });

  it("keeps the analysis for a later account return", () => {
    persistPendingAnalysis(bill);
    expect(JSON.parse(localStorage.getItem("pendingBillData") || "{}").totalAmount).toBe(750);
    expect(sessionStorage.getItem("billData")).toContain("se3");
    expect(sessionStorage.getItem("pendingAnalysis")).toBe("true");
    expect(document.cookie).toContain("pendingBillData=");
  });

  it("only auto-opens the result from the upload route", () => {
    expect(shouldAutoOpenResult("/upload")).toBe(true);
    expect(shouldAutoOpenResult("/upload/")).toBe(true);
    expect(shouldAutoOpenResult("/auth/register")).toBe(false);
    expect(shouldAutoOpenResult("/result")).toBe(false);
    expect(shouldAutoOpenResult("/premium")).toBe(false);
  });
});
