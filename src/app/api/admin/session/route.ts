import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const ok = await isAdminAuthenticated(req);
  return NextResponse.json({ success: true, authenticated: ok });
}
