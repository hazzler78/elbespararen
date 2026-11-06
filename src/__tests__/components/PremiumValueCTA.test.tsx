import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PremiumValueCTA from "@/components/PremiumValueCTA";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

describe("PremiumValueCTA keeps the analysis when signup starts", () => {
  beforeEach(() => {
    push.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "pendingBillData=; path=/; max-age=0";
    sessionStorage.setItem(
      "billData",
      JSON.stringify({
        totalAmount: 750,
        priceArea: "se3",
        confidence: 0.9,
        elnatCost: 1,
        elhandelCost: 2,
        extraFeesTotal: 0,
        extraFeesDetailed: [],
        totalKWh: 10,
        period: "oktober 2026",
        contractType: "rörligt",
      })
    );
  });

  it("stores the result before opening registration and does not clear it", async () => {
    const user = userEvent.setup();
    render(<PremiumValueCTA potentialSavings={120} />);
    await user.click(screen.getByRole("button", { name: /Skapa konto/ }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(String(push.mock.calls[0][0])).toContain("/auth/register");
    expect(JSON.parse(localStorage.getItem("pendingBillData") || "{}")).toMatchObject({
      totalAmount: 750,
      priceArea: "se3",
    });
    expect(sessionStorage.getItem("billData")).toContain("750");
    expect(sessionStorage.getItem("pendingAnalysis")).toBe("true");
  });
});
