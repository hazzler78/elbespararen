import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";

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
  dateRanges: Array<{ startDate: string; endDate: string }>
): Promise<GAResponse> {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dimensions: dimensions.map(d => ({ name: d })),
      metrics: metrics.map(m => ({ name: m })),
      dateRanges,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA API error: ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Konvertera period till datum-intervall
 */
function getDateRange(period: string): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '24h':
      startDate.setHours(endDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '12mo':
      startDate.setMonth(endDate.getMonth() - 12);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * GET /api/analytics
 * Hämtar analytics-data från Google Analytics Data API
 */
export async function GET(request: NextRequest) {
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

    // Hämta tidsperiod från query params (default: 30d)
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';
    const validPeriods = ['24h', '7d', '30d', '90d', '12mo'];
    const finalPeriod = validPeriods.includes(period) ? period : '30d';
    const dateRange = getDateRange(finalPeriod);

    // Hämta data från Google Analytics API
    try {
      // Hämta aggregerad statistik
      const statsResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        [],
        ['sessions', 'totalUsers', 'screenPageViews'],
        [dateRange]
      );

      // Hämta topp-sidor
      const pagesResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        ['pagePath'],
        ['screenPageViews'],
        [dateRange]
      );

      // Hämta källor
      const sourcesResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        ['sessionSource'],
        ['sessions'],
        [dateRange]
      );

      // Hämta enheter
      const devicesResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        ['deviceCategory'],
        ['sessions'],
        [dateRange]
      );

      // Hämta tidsdata
      const timeseriesResponse = await fetchGAData(
        gaPropertyId,
        accessToken,
        ['date'],
        ['sessions'],
        [dateRange]
      );

      // Transformera data till vårt format
      const totalStats = statsResponse.totals?.[0]?.metricValues || [];
      const data: AnalyticsData = {
        totalVisits: parseInt(totalStats[0]?.value || '0', 10),
        uniqueVisitors: parseInt(totalStats[1]?.value || '0', 10),
        pageViews: parseInt(totalStats[2]?.value || '0', 10),
        topPages: (pagesResponse.rows || [])
          .slice(0, 10)
          .map(row => ({
            path: row.dimensionValues[0]?.value || '',
            views: parseInt(row.metricValues[0]?.value || '0', 10),
          })),
        visitsByDay: (timeseriesResponse.rows || []).map(row => ({
          date: row.dimensionValues[0]?.value || '',
          visits: parseInt(row.metricValues[0]?.value || '0', 10),
        })),
        referrers: (sourcesResponse.rows || [])
          .slice(0, 10)
          .map(row => ({
            source: row.dimensionValues[0]?.value || 'Direct',
            visits: parseInt(row.metricValues[0]?.value || '0', 10),
          })),
        devices: (() => {
          const deviceRows = devicesResponse.rows || [];
          const desktopRow = deviceRows.find(r => r.dimensionValues[0]?.value === 'desktop');
          const mobileRow = deviceRows.find(r => r.dimensionValues[0]?.value === 'mobile');
          const tabletRow = deviceRows.find(r => r.dimensionValues[0]?.value === 'tablet');
          
          return {
            desktop: desktopRow ? parseInt(desktopRow.metricValues[0]?.value || '0', 10) : 0,
            mobile: mobileRow ? parseInt(mobileRow.metricValues[0]?.value || '0', 10) : 0,
            tablet: tabletRow ? parseInt(tabletRow.metricValues[0]?.value || '0', 10) : 0,
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

