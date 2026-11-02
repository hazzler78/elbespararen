import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";
import { requireAdmin } from "@/lib/admin-auth";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages för Cloudflare
export const runtime = 'edge';

/**
 * Google Analytics Data API response types
 */
interface GAResponse {
  rows?: Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>;
  totals?: Array<{
    metricValues: Array<{ value: string }>;
  }>;
}

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  analyzedBills: number;
  analyzedBillsError?: string;
  contractClicks: number;
  topPages: Array<{ path: string; views: number }>;
  visitsByDay: Array<{ date: string; visits: number }>;
  referrers: Array<{ source: string; visits: number }>;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  lastUpdated: string;
}

/**
 * Konvertera PEM private key till CryptoKey för Web Crypto API
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Ta bort PEM headers och newlines
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = pem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  
  // Konvertera base64 till ArrayBuffer
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  // Importera nyckeln
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
}

/**
 * Base64URL encode
 */
function base64url(str: string): string {
  // I Edge runtime använder vi TextEncoder och base64
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  // Konvertera Uint8Array till string för btoa
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hämta OAuth access token från service account credentials
 * Använder Web Crypto API för Edge runtime
 */
async function getAccessTokenFromServiceAccount(serviceAccountJson: string): Promise<string> {
  try {
    const credentials = JSON.parse(serviceAccountJson);
    const { client_email, private_key } = credentials;

    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const claim = {
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Skapa JWT (base64url encoding)
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedClaim = base64url(JSON.stringify(claim));
    const signatureInput = `${encodedHeader}.${encodedClaim}`;
    
    // Importera private key och signera med Web Crypto API
    const cryptoKey = await importPrivateKey(private_key);
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureInput);
    const signature = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      cryptoKey,
      data
    );
    
    // Konvertera signature till base64url
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    const signatureBase64url = signatureBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const jwt = `${signatureInput}.${signatureBase64url}`;
    
    // Exchange JWT för access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${tokenResponse.statusText} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    throw new Error(`Token error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hämta data från Google Analytics Data API
 */
async function fetchGAData(
  propertyId: string,
  accessToken: string,
  dimensions: string[],
  metrics: string[],
  dateRanges: Array<{ startDate: string; endDate: string }>,
  options?: { dimensionFilter?: any }
): Promise<GAResponse> {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  // Tom dimensions-array kan ge konstiga svar — utelämna fältet helt
  const body: Record<string, unknown> = {
    metrics: metrics.map((m) => ({ name: m })),
    dateRanges,
    metricAggregations: ["TOTAL"],
  };

  if (dimensions.length > 0) {
    body.dimensions = dimensions.map((d) => ({ name: d }));
  }

  if (options?.dimensionFilter) {
    body.dimensionFilter = options.dimensionFilter;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA API error: ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

function parseMetric(value: string | undefined | null): number {
  if (value == null || value === "") return 0;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Läs totals från GA — fallback till rows[0] när rapport saknar dimensions. */
function extractMetricTotals(response: GAResponse, metricCount: number): number[] {
  const fromTotals = response.totals?.[0]?.metricValues;
  if (fromTotals && fromTotals.length > 0) {
    return Array.from({ length: metricCount }, (_, i) =>
      parseMetric(fromTotals[i]?.value)
    );
  }
  const fromRow = response.rows?.[0]?.metricValues;
  if (fromRow && fromRow.length > 0) {
    return Array.from({ length: metricCount }, (_, i) =>
      parseMetric(fromRow[i]?.value)
    );
  }
  return Array.from({ length: metricCount }, () => 0);
}

/**
 * Period → exakt tidsfönster + GA-datum (kalenderdagar som täcker fönstret).
 * GA Data API är dagsbaserad; bill_analyses filtreras på exakt ISO-tid.
 */
function getPeriodBounds(period: string): {
  since: Date;
  until: Date;
  gaStartDate: string;
  gaEndDate: string;
} {
  const until = new Date();
  const since = new Date(until.getTime());

  switch (period) {
    case "24h":
      since.setTime(until.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      since.setTime(until.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      since.setTime(until.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      since.setTime(until.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "12mo":
      since.setMonth(until.getMonth() - 12);
      break;
    default:
      since.setTime(until.getTime() - 24 * 60 * 60 * 1000);
  }

  return {
    since,
    until,
    gaStartDate: since.toISOString().slice(0, 10),
    gaEndDate: until.toISOString().slice(0, 10),
  };
}

function resolveDbBinding(): unknown {
  let env: Record<string, unknown> = {};
  if ((globalThis as any).getRequestContext) {
    env = (globalThis as any).getRequestContext()?.env ?? {};
  }
  if (!env.DB && (process.env as any).DB) {
    env.DB = (process.env as any).DB;
  }
  if (!env.DB && (globalThis as any).env?.DB) {
    env.DB = (globalThis as any).env.DB;
  }
  return env.DB;
}

function formatBillCountError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/exceeded D1's free tier|row read limit|code:\s*7500/i.test(message)) {
    return "D1 free-tier läsgräns nådd — siffran kan inte hämtas just nu (återställs midnatt UTC).";
  }
  if (/no such table|bill_analyses/i.test(message)) {
    return "bill_analyses-tabellen saknas eller är otillgänglig.";
  }
  return message || "Kunde inte räkna analyserade fakturor.";
}

/**
 * Räkna analyserade fakturor från D1 (bill_analyses) med exakt tidsgräns.
 */
async function countAnalyzedBills(
  since: Date
): Promise<{ count: number; error?: string }> {
  try {
    const binding = resolveDbBinding();
    if (!binding) {
      return {
        count: 0,
        error: "D1-binding saknas — kan inte räkna fakturor.",
      };
    }
    const db = createDatabaseFromBinding(binding);
    const count = await db.countBillAnalysesSince(since);
    return { count };
  } catch (error) {
    console.error("[analytics] Error in countAnalyzedBills:", error);
    return { count: 0, error: formatBillCountError(error) };
  }
}

/**
 * GET /api/analytics
 * Hämtar analytics-data från Google Analytics Data API
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
    const gaPropertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    const gaAccessToken = process.env.GOOGLE_ANALYTICS_ACCESS_TOKEN;
    const gaServiceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // Om analytics inte är aktiverat
    if (!analyticsEnabled) {
      return NextResponse.json({
        success: true,
        data: {
          enabled: false,
          message: "Analytics är inte aktiverat. Sätt NEXT_PUBLIC_ENABLE_ANALYTICS=true i .env för att se data.",
        }
      } as ApiResponse<{ enabled: boolean; message: string }>);
    }

    // Kontrollera om Google Analytics är konfigurerat
    if (!gaPropertyId) {
      return NextResponse.json({
        success: true,
        data: {
          enabled: true,
          analytics: null,
          message: "Google Analytics Property ID saknas. Lägg till GOOGLE_ANALYTICS_PROPERTY_ID i .env.",
        }
      } as ApiResponse<{ enabled: boolean; analytics: AnalyticsData | null; message: string }>);
    }

    // Hämta access token - antingen direkt eller från service account
    let accessToken = gaAccessToken;
    
    if (!accessToken && gaServiceAccount) {
      try {
        accessToken = await getAccessTokenFromServiceAccount(gaServiceAccount);
      } catch (tokenError) {
        console.error('[analytics] Service account token error:', tokenError);
        return NextResponse.json({
          success: true,
          data: {
            enabled: true,
            analytics: null,
            message: `Kunde inte hämta access token från service account: ${tokenError instanceof Error ? tokenError.message : 'Okänt fel'}. Kontrollera att GOOGLE_APPLICATION_CREDENTIALS är korrekt formaterad JSON.`,
          }
        } as ApiResponse<{ enabled: boolean; analytics: AnalyticsData | null; message: string }>);
      }
    }

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        data: {
          enabled: true,
          analytics: null,
          message: "Google Analytics Access Token saknas. Lägg till antingen GOOGLE_ANALYTICS_ACCESS_TOKEN eller GOOGLE_APPLICATION_CREDENTIALS i .env. Se docs/GOOGLE_ANALYTICS_SETUP.md för instruktioner.",
        }
      } as ApiResponse<{ enabled: boolean; analytics: AnalyticsData | null; message: string }>);
    }

    // Hämta tidsperiod från query params (default: 24h)
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "24h";
    const validPeriods = ["24h", "7d", "30d", "90d", "12mo"];
    const finalPeriod = validPeriods.includes(period) ? period : "24h";
    const bounds = getPeriodBounds(finalPeriod);
    const dateRange = {
      startDate: bounds.gaStartDate,
      endDate: bounds.gaEndDate,
    };

    // Hämta data från Google Analytics API
    try {
      // GA4 web: screenPageViews is the valid metric (pageViews is rejected by Data API)
      const pageMetric = "screenPageViews";
      const statsResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        [],
        ["sessions", "totalUsers", pageMetric],
        [dateRange]
      );

      const pagesResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        ["pagePath"],
        [pageMetric],
        [dateRange]
      );

      const sourcesResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        ["sessionSource"],
        ["sessions"],
        [dateRange]
      );

      const devicesResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        ["deviceCategory"],
        ["sessions"],
        [dateRange]
      );

      const timeseriesResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        ["date"],
        ["sessions"],
        [dateRange]
      );

      let contractClicksCount = 0;
      try {
        const contractClicksResponse = await fetchGAData(
          gaPropertyId,
          accessToken,
          ["eventName"],
          ["eventCount"],
          [dateRange],
          {
            dimensionFilter: {
              filter: {
                fieldName: "eventName",
                stringFilter: {
                  matchType: "EXACT",
                  value: "contract_click",
                },
              },
            },
          }
        );
        const clickTotals = extractMetricTotals(contractClicksResponse, 1);
        contractClicksCount =
          clickTotals[0] ||
          (contractClicksResponse.rows || []).reduce(
            (sum, row) => sum + parseMetric(row.metricValues[0]?.value),
            0
          );
      } catch (eventError) {
        console.warn("[analytics] Could not fetch contract clicks:", eventError);
      }

      // Räkna analyser från D1 med exakt tidsgräns (inte hela kalenderdagar i storage)
      const analyzedBillsResult = await countAnalyzedBills(bounds.since);
      const analyzedBillsCount = analyzedBillsResult.count;

      const [sessionsFromTotals, usersFromTotals, pageViewsFromTotals] =
        extractMetricTotals(statsResponse, 3);

      const totalPageViewsFromPages = (pagesResponse.rows || []).reduce(
        (sum, row) => sum + parseMetric(row.metricValues[0]?.value),
        0
      );
      const totalSessionsFromSources = (sourcesResponse.rows || []).reduce(
        (sum, row) => sum + parseMetric(row.metricValues[0]?.value),
        0
      );
      const totalSessionsFromDevices = (devicesResponse.rows || []).reduce(
        (sum, row) => sum + parseMetric(row.metricValues[0]?.value),
        0
      );

      const totalVisits =
        sessionsFromTotals ||
        totalSessionsFromSources ||
        totalSessionsFromDevices;
      const uniqueVisitors = usersFromTotals || totalVisits;
      const pageViews = pageViewsFromTotals || totalPageViewsFromPages;

      console.log("[analytics] Parsed stats:", {
        period: finalPeriod,
        since: bounds.since.toISOString(),
        gaRange: dateRange,
        totalVisits,
        uniqueVisitors,
        pageViews,
        analyzedBillsCount,
        analyzedBillsError: analyzedBillsResult.error,
        contractClicksCount,
        rawTotals: statsResponse.totals,
        rawRows: statsResponse.rows?.length ?? 0,
      });

      const data: AnalyticsData = {
        totalVisits,
        uniqueVisitors,
        pageViews,
        analyzedBills: analyzedBillsCount,
        analyzedBillsError: analyzedBillsResult.error,
        contractClicks: contractClicksCount,
        topPages: (pagesResponse.rows || []).slice(0, 10).map((row) => ({
          path: row.dimensionValues[0]?.value || "",
          views: parseMetric(row.metricValues[0]?.value),
        })),
        visitsByDay: (timeseriesResponse.rows || []).map((row) => ({
          date: row.dimensionValues[0]?.value || "",
          visits: parseMetric(row.metricValues[0]?.value),
        })),
        referrers: (sourcesResponse.rows || []).slice(0, 10).map((row) => ({
          source: row.dimensionValues[0]?.value || "Direct",
          visits: parseMetric(row.metricValues[0]?.value),
        })),
        devices: (() => {
          const deviceRows = devicesResponse.rows || [];
          const desktopRow = deviceRows.find(
            (r) => r.dimensionValues[0]?.value === "desktop"
          );
          const mobileRow = deviceRows.find(
            (r) => r.dimensionValues[0]?.value === "mobile"
          );
          const tabletRow = deviceRows.find(
            (r) => r.dimensionValues[0]?.value === "tablet"
          );

          return {
            desktop: desktopRow
              ? parseMetric(desktopRow.metricValues[0]?.value)
              : 0,
            mobile: mobileRow
              ? parseMetric(mobileRow.metricValues[0]?.value)
              : 0,
            tablet: tabletRow
              ? parseMetric(tabletRow.metricValues[0]?.value)
              : 0,
          };
        })(),
        lastUpdated: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: {
          enabled: true,
          analytics: data,
        }
      } as ApiResponse<{ enabled: boolean; analytics: AnalyticsData }>);
    } catch (apiError) {
      console.error('[analytics] GA API error:', apiError);
      return NextResponse.json({
        success: false,
        error: `Kunde inte hämta data från Google Analytics: ${apiError instanceof Error ? apiError.message : 'Okänt fel'}`,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[analytics] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta analytics-data" },
      { status: 500 }
    );
  }
}

