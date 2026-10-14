import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  fetchSalesysPeriodStats,
  SALESYS_DASHBOARD_URL,
} from "@/lib/salesys";

export const runtime = "edge";

/**
 * GET /api/admin/salesys
 * SaleSys order counts (today + this month).
 * Response includes both Elbespararen and Elchef channels; UIs filter as needed.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const [today, month] = await Promise.all([
      fetchSalesysPeriodStats("today"),
      fetchSalesysPeriodStats("month"),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        dashboardUrl: SALESYS_DASHBOARD_URL,
        today,
        month,
      },
    });
  } catch (error) {
    console.error("[admin/salesys] error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Kunde inte hämta SaleSys-statistik",
      },
      { status: 500 }
    );
  }
}
