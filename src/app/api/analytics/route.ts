import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";

// Edge runtime krävs av next-on-pages
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
 * OBS: Service Account kräver JWT-signering som inte fungerar i Edge runtime.
 * Använd GOOGLE_ANALYTICS_ACCESS_TOKEN direkt istället.
 * För att få access token, se docs/GOOGLE_ANALYTICS_SETUP.md
 */

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

    // Hämta access token
    // OBS: Service Account kräver JWT-signering som inte fungerar i Edge runtime
    // Använd GOOGLE_ANALYTICS_ACCESS_TOKEN direkt (se docs/GOOGLE_ANALYTICS_SETUP.md)
    const accessToken = gaAccessToken;

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        data: {
          enabled: true,
          analytics: null,
          message: "Google Analytics Access Token saknas. Lägg till GOOGLE_ANALYTICS_ACCESS_TOKEN i .env. Se docs/GOOGLE_ANALYTICS_SETUP.md för instruktioner.",
        }
      } as ApiResponse<{ enabled: boolean; analytics: AnalyticsData | null; message: string }>);
    }

    // Hämta tidsperiod från query params (default: 30d)
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';
    const validPeriods = ['7d', '30d', '90d', '12mo'];
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

