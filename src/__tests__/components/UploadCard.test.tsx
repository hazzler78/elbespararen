import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadCard from "@/components/UploadCard";

const bill = {
  elnatCost: 400,
  elhandelCost: 300,
  extraFeesTotal: 50,
  extraFeesDetailed: [],
  totalKWh: 500,
  period: "oktober 2026",
  contractType: "rörligt" as const,
  confidence: 0.9,
  totalAmount: 750,
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => (typeof body === "string" ? {} : body),
  };
}

function mockFetch(parseResult: { status: number; body: unknown }) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("postal-code-analytics")) {
      return jsonResponse(200, { success: true });
    }
    return jsonResponse(parseResult.status, parseResult.body);
  }) as jest.Mock;
}

async function selectInvoiceAndPostcode() {
  const user = userEvent.setup();
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10])], "faktura.png", {
    type: "image/png",
  });
  await user.upload(input, file);
  expect(await screen.findByText("faktura.png")).toBeInTheDocument();
  await user.type(screen.getByPlaceholderText("123 45"), "67131");
  expect(await screen.findByText(/SE3/)).toBeInTheDocument();
  return user;
}

describe("UploadCard analysis feedback", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("replaces Kom igång with a result action after a successful analysis and keeps the invoice", async () => {
    mockFetch({ status: 200, body: { success: true, data: bill } });
    const onUploadSuccess = jest.fn();
    render(<UploadCard onUploadSuccess={onUploadSuccess} />);
    const user = await selectInvoiceAndPostcode();

    await user.click(screen.getByRole("button", { name: "Kom igång" }));

    expect(await screen.findByText("Analysen är klar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kom igång" })).not.toBeInTheDocument();
    expect(screen.getByText("faktura.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Se resultatet" }));

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledTimes(1));
    expect(onUploadSuccess.mock.calls[0][0]).toMatchObject({
      totalAmount: 750,
      confidence: 0.9,
      priceArea: "se3",
    });
  });

  it("shows a Swedish error and keeps the invoice when analysis fails", async () => {
    mockFetch({
      status: 500,
      body: {
        success: false,
        error: "Kunde inte analysera fakturan",
        details: "Incorrect API key provided: sk-secret",
      },
    });
    const onUploadSuccess = jest.fn();
    render(<UploadCard onUploadSuccess={onUploadSuccess} />);
    const user = await selectInvoiceAndPostcode();

    await user.click(screen.getByRole("button", { name: "Kom igång" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Din faktura är kvar");
    expect(alert).not.toHaveTextContent("sk-secret");
    expect(screen.getByText("faktura.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kom igång" })).toBeEnabled();
    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(screen.queryByText("Analysen är klar")).not.toBeInTheDocument();
  });

  it("explains a non-JSON failure instead of resetting silently", async () => {
    mockFetch({ status: 502, body: "<html>gateway</html>" });
    render(<UploadCard onUploadSuccess={jest.fn()} />);
    const user = await selectInvoiceAndPostcode();

    await user.click(screen.getByRole("button", { name: "Kom igång" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/svarade inte/);
    expect(screen.getByText("faktura.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kom igång" })).toBeEnabled();
  });

  it("navigates immediately when the user is already logged in", async () => {
    mockFetch({ status: 200, body: { success: true, data: bill } });
    const onUploadSuccess = jest.fn();
    render(<UploadCard onUploadSuccess={onUploadSuccess} isUserLoggedIn />);
    const user = await selectInvoiceAndPostcode();

    await user.click(screen.getByRole("button", { name: "Kom igång" }));

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledTimes(1));
    expect(onUploadSuccess.mock.calls[0][0].priceArea).toBe("se3");
  });
});
