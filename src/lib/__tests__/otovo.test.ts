import {
  buildOtovoInterestBody,
  mapOtovoResultToDbStatus,
  parseYearlyConsumptionKwh,
  submitOtovoInterest,
  OTOVO_DEFAULT_UTM_CAMPAIGN,
  OTOVO_DEFAULT_UTM_SOURCE,
} from "@/lib/otovo";

describe("otovo", () => {
  describe("parseYearlyConsumptionKwh", () => {
    it("parses digits from formatted strings", () => {
      expect(parseYearlyConsumptionKwh("10 000 kWh/år")).toBe(10000);
      expect(parseYearlyConsumptionKwh("")).toBeNull();
      expect(parseYearlyConsumptionKwh("abc")).toBeNull();
    });
  });

  describe("buildOtovoInterestBody", () => {
    it("builds payload with UTM defaults and address", () => {
      const body = buildOtovoInterestBody(
        {
          name: "Test",
          email: "a@b.se",
          phone: "0701234567",
          city: "Stockholm",
          address: "Storgatan 1",
          consumption: "12000",
          utmId: "campaign-x",
        },
        { utmSource: OTOVO_DEFAULT_UTM_SOURCE, utmCampaign: OTOVO_DEFAULT_UTM_CAMPAIGN }
      );

      expect(body.name).toBe("Test");
      expect(body.address).toBe("Storgatan 1, Stockholm");
      expect(body.extra_information).toEqual({ yearly_consumption_kwh: 12000 });
      expect(body.utm_data).toMatchObject({
        utm_medium: "lead-generation",
        utm_source: OTOVO_DEFAULT_UTM_SOURCE,
        utm_campaign: OTOVO_DEFAULT_UTM_CAMPAIGN,
        utm_id: "campaign-x",
      });
    });
  });

  describe("submitOtovoInterest", () => {
    const config = {
      apiBaseUrl: "https://api.example.test",
      apiToken: "test-token",
      utmSource: "elchef_se",
      utmCampaign: "elchef_CPS_newbuilds",
    };

    const input = {
      name: "Test",
      email: "test@example.com",
      phone: "0701234567",
      city: "Göteborg",
    };

    it("skips when token is missing", async () => {
      const result = await submitOtovoInterest(input, { ...config, apiToken: undefined });
      expect(result).toEqual({ status: "skipped_no_token" });
    });

    it("does not call create when validate fails", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ is_valid: false, message: "bad phone" }),
      });

      const result = await submitOtovoInterest(input, config, fetchMock as typeof fetch);

      expect(result.status).toBe("validation_failed");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain("/validate_data");
    });

    it("calls create only after successful validate", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ is_valid: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "interest-42" }),
        });

      const result = await submitOtovoInterest(input, config, fetchMock as typeof fetch);

      expect(result).toEqual({ status: "success", interestId: "interest-42" });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(String(fetchMock.mock.calls[1][0])).toContain("/partner/v1/interests/");
      const createInit = fetchMock.mock.calls[1][1] as RequestInit;
      expect(createInit.method).toBe("POST");
    });

    it("maps results to DB status", () => {
      expect(mapOtovoResultToDbStatus({ status: "success", interestId: "x" }).otovoStatus).toBe(
        "success"
      );
      expect(
        mapOtovoResultToDbStatus({ status: "validate_error", httpStatus: 400, detail: "nope" })
          .otovoError
      ).toContain("400");
    });
  });
});
