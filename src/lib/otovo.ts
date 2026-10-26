/**
 * Otovo Partner Lead API (validate_data → interests/)
 * Reference: Elchef hemsida sendOtovoInterest()
 */

export const OTOVO_DEFAULT_API_BASE_URL = "https://api.otovo.com";
export const OTOVO_DEFAULT_UTM_SOURCE = "elchef_se";
export const OTOVO_DEFAULT_UTM_CAMPAIGN = "elchef_CPS_newbuilds";

export type OtovoConfig = {
  apiBaseUrl: string;
  apiToken?: string;
  utmSource: string;
  utmCampaign: string;
};

export type OtovoLeadInput = {
  name: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  consumption?: string;
  utmId?: string;
};

export type OtovoSubmitResult =
  | { status: "skipped_no_token" }
  | { status: "validation_failed"; detail?: string }
  | { status: "validate_error"; httpStatus: number; detail: string }
  | { status: "create_error"; httpStatus: number; detail: string }
  | { status: "success"; interestId: string };

export function parseYearlyConsumptionKwh(raw?: string | null): number | null {
  if (!raw) return null;
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) return null;
  const value = Number(digitsOnly);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function buildOtovoInterestBody(
  input: OtovoLeadInput,
  config: Pick<OtovoConfig, "utmSource" | "utmCampaign">
): Record<string, unknown> {
  const addressParts: string[] = [];
  if (input.address?.trim()) addressParts.push(input.address.trim());
  if (input.city?.trim()) addressParts.push(input.city.trim());
  const address = addressParts.join(", ");

  const yearlyConsumptionKwh = parseYearlyConsumptionKwh(input.consumption);

  const utm_data = {
    utm_campaign: config.utmCampaign,
    utm_medium: "lead-generation",
    utm_source: config.utmSource,
    utm_term: "",
    utm_id: input.utmId || "",
  };

  const body: Record<string, unknown> = {
    name: input.name || "",
    email: input.email,
    phone_number: input.phone || "",
    utm_data,
  };

  if (address) {
    body.address = address;
  }

  if (yearlyConsumptionKwh) {
    body.extra_information = {
      yearly_consumption_kwh: yearlyConsumptionKwh,
    };
  }

  return body;
}

export function getOtovoConfig(
  getEnv: (key: string) => string | undefined
): OtovoConfig {
  return {
    apiBaseUrl: getEnv("OTOVO_API_BASE_URL") ?? OTOVO_DEFAULT_API_BASE_URL,
    apiToken: getEnv("OTOVO_API_TOKEN"),
    utmSource: getEnv("OTOVO_UTM_SOURCE") ?? OTOVO_DEFAULT_UTM_SOURCE,
    utmCampaign: getEnv("OTOVO_UTM_CAMPAIGN") ?? OTOVO_DEFAULT_UTM_CAMPAIGN,
  };
}

function extractInterestId(created: unknown): string {
  if (!created || typeof created !== "object") return "";
  const row = created as Record<string, unknown>;
  const id = row.id ?? row.interest_id ?? row.uuid;
  return id != null ? String(id) : "";
}

/**
 * Validates then creates an Otovo interest. Never call without mocking fetch in tests.
 */
export async function submitOtovoInterest(
  input: OtovoLeadInput,
  config: OtovoConfig,
  fetchImpl?: typeof fetch
): Promise<OtovoSubmitResult> {
  const doFetch = fetchImpl ?? globalThis.fetch;
  if (!config.apiToken) {
    console.warn("[otovo] OTOVO_API_TOKEN is not configured — lead stored locally only");
    return { status: "skipped_no_token" };
  }

  const body = buildOtovoInterestBody(input, config);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Token ${config.apiToken}`,
  };

  try {
    const validateRes = await doFetch(
      `${config.apiBaseUrl}/partner/v1/interests/validate_data`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    if (!validateRes.ok) {
      const detail = await validateRes.text();
      console.error("[otovo] validate_data failed:", validateRes.status, detail);
      return {
        status: "validate_error",
        httpStatus: validateRes.status,
        detail,
      };
    }

    const validateJson = (await validateRes.json()) as {
      is_valid?: boolean;
      message?: string;
    };

    if (!validateJson.is_valid) {
      console.warn("[otovo] validate_data invalid:", validateJson);
      return {
        status: "validation_failed",
        detail: validateJson.message,
      };
    }

    const createRes = await doFetch(`${config.apiBaseUrl}/partner/v1/interests/`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const detail = await createRes.text();
      console.error("[otovo] interest create failed:", createRes.status, detail);
      return {
        status: "create_error",
        httpStatus: createRes.status,
        detail,
      };
    }

    const created = await createRes.json();
    const interestId = extractInterestId(created);
    console.log("[otovo] interest created:", interestId || created);
    return { status: "success", interestId };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[otovo] unexpected error:", detail);
    return { status: "create_error", httpStatus: 0, detail };
  }
}

export function mapOtovoResultToDbStatus(
  result: OtovoSubmitResult
): {
  otovoStatus: string;
  otovoInterestId?: string | null;
  otovoError?: string | null;
} {
  switch (result.status) {
    case "skipped_no_token":
      return { otovoStatus: "skipped_no_token" };
    case "validation_failed":
      return {
        otovoStatus: "validation_failed",
        otovoError: result.detail || "validate_data: is_valid=false",
      };
    case "validate_error":
      return {
        otovoStatus: "validate_error",
        otovoError: `HTTP ${result.httpStatus}: ${result.detail}`,
      };
    case "create_error":
      return {
        otovoStatus: "create_error",
        otovoError: `HTTP ${result.httpStatus}: ${result.detail}`,
      };
    case "success":
      return {
        otovoStatus: "success",
        otovoInterestId: result.interestId || null,
      };
    default:
      return { otovoStatus: "create_error", otovoError: "unknown" };
  }
}
