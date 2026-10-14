/**
 * SaleSys public dashboard stats (Elchef/Elbespararen order counts).
 * Uses the shared statistik.salesys.se dashboard-link API.
 *
 * Both brands are returned from the API. Elbespararen admin UI should
 * filter to brand === "Elbespararen"; Elchef.se/admin can show Elchef.
 */

const SALESYS_BASE = "https://statistik.salesys.se/api/users/dashboard-links-v1";

/** Public dashboard link from statistik.salesys.se (same URL Mikael shared). */
export const SALESYS_DEFAULT_TOKEN =
  process.env.SALESYS_DASHBOARD_TOKEN ||
  "497D41e8287176eACd7f87AC0c2375da11D3354DE745CeA05CDD6d12cABb5cB0A8cf3d15";

export const SALESYS_DEFAULT_DASHBOARD_ID =
  process.env.SALESYS_DASHBOARD_ID || "6970aa19ea9140b4172061ec";

export const SALESYS_DASHBOARD_URL = `https://statistik.salesys.se/${SALESYS_DEFAULT_TOKEN}/${SALESYS_DEFAULT_DASHBOARD_ID}`;

export type SalesysChannelStat = {
  readerId: string;
  name: string;
  brand: "Elchef" | "Elbespararen" | "Other";
  provider: string;
  value: number;
  position: number;
};

export type SalesysPeriodStats = {
  period: "today" | "month";
  after: string;
  channels: SalesysChannelStat[];
  elbespararenTotal: number;
  elchefTotal: number;
  total: number;
};

type SalesysReader = {
  id: string;
  name: string;
  position?: number;
};

type SalesysDashboardConfig = {
  dashboards: Array<{
    id: string;
    name: string;
    readers: SalesysReader[];
  }>;
};

type SalesysResultRow = {
  readerId: string;
  intervals?: Array<{ value?: number }>;
};

function stockholmOffset(): string {
  // Europe/Stockholm offset for "now" (handles CET/CEST)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    timeZoneName: "shortOffset",
  }).formatToParts(new Date());
  const tz = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+1";
  const m = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!m) return "+01:00";
  const hours = Number(m[1]);
  const mins = m[2] || "00";
  const sign = hours >= 0 ? "+" : "-";
  return `${sign}${String(Math.abs(hours)).padStart(2, "0")}:${mins.padStart(2, "0")}`;
}

function stockholmYmd(d = new Date()): { y: number; m: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, day] = fmt.format(d).split("-").map(Number);
  return { y, m, day };
}

function periodAfterIso(period: "today" | "month"): string {
  const { y, m, day } = stockholmYmd();
  const offset = stockholmOffset();
  if (period === "today") {
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000${offset}`;
  }
  return `${y}-${String(m).padStart(2, "0")}-01T00:00:00.000${offset}`;
}

function parseBrand(name: string): { brand: SalesysChannelStat["brand"]; provider: string } {
  if (name.startsWith("Elbespararen")) {
    return { brand: "Elbespararen", provider: name.replace(/^Elbespararen\s*-\s*/i, "").trim() };
  }
  if (name.startsWith("Elchef")) {
    return { brand: "Elchef", provider: name.replace(/^Elchef\s*-\s*/i, "").trim() };
  }
  return { brand: "Other", provider: name };
}

export async function fetchSalesysDashboardConfig(
  token: string = SALESYS_DEFAULT_TOKEN
): Promise<SalesysDashboardConfig> {
  const res = await fetch(`${SALESYS_BASE}/${token}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Salesys config ${res.status}`);
  }
  return (await res.json()) as SalesysDashboardConfig;
}

export async function fetchSalesysPeriodStats(
  period: "today" | "month" = "month",
  options?: { token?: string; dashboardId?: string }
): Promise<SalesysPeriodStats> {
  const token = options?.token || SALESYS_DEFAULT_TOKEN;
  const dashboardId = options?.dashboardId || SALESYS_DEFAULT_DASHBOARD_ID;
  const after = periodAfterIso(period);

  const config = await fetchSalesysDashboardConfig(token);
  const dashboard =
    config.dashboards.find((d) => d.id === dashboardId) || config.dashboards[0];
  if (!dashboard) {
    throw new Error("Salesys dashboard not found");
  }

  const readers = dashboard.readers.map((r) => ({
    readerId: r.id,
    intervalCount: 5,
  }));

  const body = {
    filters: {
      before: null,
      after,
      orders: { dateStrategy: "dateOnly" },
      calls: {},
      offers: {},
      projectIds: null,
    },
    groupedName: false,
    readers,
  };

  const res = await fetch(`${SALESYS_BASE}/${token}/${dashboard.id}/results`, {
    method: "POST",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Salesys results ${res.status}: ${text.slice(0, 200)}`);
  }

  const rows = (await res.json()) as SalesysResultRow[];
  const valueByReader = new Map<string, number>();
  for (const row of rows) {
    valueByReader.set(row.readerId, Number(row.intervals?.[0]?.value || 0));
  }

  const channels: SalesysChannelStat[] = dashboard.readers
    .map((reader) => {
      const { brand, provider } = parseBrand(reader.name);
      return {
        readerId: reader.id,
        name: reader.name,
        brand,
        provider,
        value: valueByReader.get(reader.id) || 0,
        position: reader.position ?? 0,
      };
    })
    .sort((a, b) => a.position - b.position);

  const elbespararenTotal = channels
    .filter((c) => c.brand === "Elbespararen")
    .reduce((sum, c) => sum + c.value, 0);
  const elchefTotal = channels
    .filter((c) => c.brand === "Elchef")
    .reduce((sum, c) => sum + c.value, 0);

  return {
    period,
    after,
    channels,
    elbespararenTotal,
    elchefTotal,
    total: elbespararenTotal + elchefTotal,
  };
}
