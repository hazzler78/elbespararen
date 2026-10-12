import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminPassword,
  getAdminSecret,
  passwordsMatch,
} from "@/lib/admin-auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const password = getAdminPassword();
    const secret = getAdminSecret();

    if (!password || !secret) {
      return NextResponse.json(
        { success: false, error: "Admin not configured" },
        { status: 503 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { password?: string };
    const provided = typeof body.password === "string" ? body.password : "";

    if (!(await passwordsMatch(provided, password))) {
      return NextResponse.json(
        { success: false, error: "Fel lösenord" },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken(secret);
    const response = NextResponse.json({ success: true });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      token,
      adminSessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("[admin/login] error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
