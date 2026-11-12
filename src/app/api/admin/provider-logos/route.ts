import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  saveProviderLogo,
  validateProviderLogoFile,
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

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const providerId = String(formData.get("providerId") || "new-provider");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Ingen fil skickades." },
        { status: 400 }
      );
    }

    const validationError = validateProviderLogoFile(file);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const result = await saveProviderLogo(file, providerId, {
      env: resolveEnv(),
    });

    return NextResponse.json({
      success: true,
      data: {
        logoUrl: result.logoUrl,
        key: result.key,
        storage: result.storage,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error("[admin/provider-logos] POST error:", error);
    const message = error instanceof Error ? error.message : "Uppladdning misslyckades";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
