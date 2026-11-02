import { NextRequest, NextResponse } from "next/server";
import { BILL_IMAGE_RETENTION_DAYS, purgeExpiredBillImages } from "@/lib/storage/bill-images";

export const runtime = "edge";

// Raderar fakturabilder äldre än 30 dagar. Anropas dagligen av
// .github/workflows/purge-bill-images.yml. Kräver CRON_SECRET (fail closed).
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const env =
    (typeof (globalThis as any).getRequestContext === "function"
      ? (globalThis as any).getRequestContext()?.env
      : undefined) || (globalThis as any)?.env;

  const result = await purgeExpiredBillImages(BILL_IMAGE_RETENTION_DAYS, { env });
  console.log("[purge-bill-images]", result);
  return NextResponse.json({ success: result.errors.length === 0, ...result });
}

export const GET = handle;
export const POST = handle;
