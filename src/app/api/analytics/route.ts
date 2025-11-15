import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

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
 * GET /api/analytics
 * Hämtar analytics-data
 * För nu returnerar vi mock-data eller länkar till externa dashboards
 * Kan utökas med Google Analytics API-integration senare
 */
export async function GET(request: NextRequest) {
  try {
    const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;

    // Om analytics inte är aktiverat, returnera info om att aktivera det
    if (!analyticsEnabled) {
      return NextResponse.json({
        success: true,
        data: {
          enabled: false,
          message: "Analytics är inte aktiverat. Aktivera det i .env för att se data.",
          links: {
            googleAnalytics: gaId ? `https://analytics.google.com/analytics/web/#/p${gaId.replace('G-', '')}/reports/dashboard` : null,
            hotjar: hotjarId ? `https://insights.hotjar.com/sites/${hotjarId}/dashboard` : null,
          }
        }
      } as ApiResponse<{ enabled: boolean; message: string; links: { googleAnalytics: string | null; hotjar: string | null } }>);
    }

    // TODO: Här kan vi lägga till Google Analytics Data API-integration
    // För nu returnerar vi en struktur med länkar till externa dashboards
    // och kan lägga till mock-data för utveckling

    const data: AnalyticsData = {
      totalVisits: 0, // Kommer från GA API
      uniqueVisitors: 0, // Kommer från GA API
      pageViews: 0, // Kommer från GA API
      topPages: [], // Kommer från GA API
      visitsByDay: [], // Kommer från GA API
      referrers: [], // Kommer från GA API
      devices: {
        desktop: 0,
        mobile: 0,
        tablet: 0,
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        enabled: true,
        analytics: data,
        links: {
          googleAnalytics: gaId ? `https://analytics.google.com/analytics/web/#/p${gaId.replace('G-', '')}/reports/dashboard` : null,
          hotjar: hotjarId ? `https://insights.hotjar.com/sites/${hotjarId}/dashboard` : null,
        },
        note: "För att se riktig data, integrera Google Analytics Data API. För nu kan du använda länkarna ovan."
      }
    } as ApiResponse<{
      enabled: boolean;
      analytics: AnalyticsData;
      links: { googleAnalytics: string | null; hotjar: string | null };
      note: string;
    }>);
  } catch (error) {
    console.error("[analytics] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta analytics-data" },
      { status: 500 }
    );
  }
}

