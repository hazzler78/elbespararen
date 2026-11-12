import { NextRequest, NextResponse } from "next/server";
import {
  getProviderLogoObject,
  isProviderLogoObjectKey,
  type ProviderLogoEnv,
} from "@/lib/storage/provider-logos";

export const runtime = "edge";

function resolveEnv(): ProviderLogoEnv {
  let env: ProviderLogoEnv = {};
  if ((globalThis as any).getRequestContext) {
    env = (globalThis as any).getRequestContext()?.env ?? {};
  }
  if (!env.BILL_IMAGES && (process.env as any).BILL_IMAGES) {
    env.BILL_IMAGES = (process.env as any).BILL_IMAGES;
  }
  if (!env.BILL_IMAGES && (globalThis as any).env?.BILL_IMAGES) {
    env.BILL_IMAGES = (globalThis as any).env.BILL_IMAGES;
  }
  return env;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key: rawKey } = await params;
    const key = decodeURIComponent(rawKey || "");

    if (!key || !isProviderLogoObjectKey(key)) {
      return NextResponse.json(
        { success: false, error: "Ogiltig logotypnyckel" },
        { status: 400 }
      );
    }

    const object = await getProviderLogoObject(key, resolveEnv());
    if (!object) {
      return NextResponse.json(
        { success: false, error: "Logotyp hittades inte" },
        { status: 404 }
      );
    }

    return new NextResponse(object.arrayBuffer, {
      headers: {
        "Content-Type": object.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("[provider-logos] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta logotyp" },
      { status: 500 }
    );
  }
}
