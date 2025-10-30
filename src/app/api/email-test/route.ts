import { NextRequest, NextResponse } from "next/server";
import { addToNewsletter, getDefaultNewsletterGroupId, getDefaultReceiptsGroupId, sendEmail } from "@/lib/email";

export const runtime = 'edge';

function getEnvVar(name: string): string | undefined {
  try {
    const ctxEnv = (globalThis as any).getRequestContext?.()?.env;
    if (ctxEnv && typeof ctxEnv[name] === "string" && ctxEnv[name]) return ctxEnv[name] as string;
  } catch {}
  try {
    const workerEnv = (globalThis as any).env;
    if (workerEnv && typeof workerEnv[name] === "string" && workerEnv[name]) return workerEnv[name] as string;
  } catch {}
  return (process.env as any)?.[name] as string | undefined;
}

function isEmailTestAllowed(req: NextRequest): boolean {
  const enabled = (getEnvVar("EMAIL_TEST_ENABLED") || "").toLowerCase() === "true";
  if (enabled) return true;
  const token = getEnvVar("EMAIL_TEST_TOKEN");
  const url = new URL(req.url);
  const qp = url.searchParams.get("token");
  const headerToken = req.headers.get("x-email-test-token");
  return !!token && (qp === token || headerToken === token);
}

export async function POST(req: NextRequest) {
  try {
    if (!isEmailTestAllowed(req)) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const body = await req.json() as {
      email?: string;
      name?: string;
      sendTestEmail?: boolean;
      subscribeNewsletter?: boolean;
      subscribeReceipts?: boolean;
    };

    const { email, name, sendTestEmail = true, subscribeNewsletter = true, subscribeReceipts = false } = body || {};

    if (!email) {
      return NextResponse.json({ success: false, error: "email required" }, { status: 400 });
    }

    const results: Record<string, unknown> = { email, name };

    if (sendTestEmail) {
      try {
        await sendEmail("Test: Elchef.se e-post", `<div>Hej ${name || ''}! Detta är ett test.</div>`, { email, name });
        results.sendEmail = "ok";
      } catch (e) {
        console.error("[email-test] sendEmail failed", e);
        results.sendEmail = String(e instanceof Error ? e.message : e);
      }
    }

    if (subscribeNewsletter) {
      try {
        await addToNewsletter({ email, name }, getDefaultNewsletterGroupId());
        results.subscribeNewsletter = "ok";
      } catch (e) {
        console.error("[email-test] subscribeNewsletter failed", e);
        results.subscribeNewsletter = String(e instanceof Error ? e.message : e);
      }
    }

    if (subscribeReceipts) {
      try {
        await addToNewsletter({ email, name }, getDefaultReceiptsGroupId());
        results.subscribeReceipts = "ok";
      } catch (e) {
        console.error("[email-test] subscribeReceipts failed", e);
        results.subscribeReceipts = String(e instanceof Error ? e.message : e);
      }
    }

    console.log("[email-test] results", results);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("[email-test] error", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!isEmailTestAllowed(req)) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || undefined;
    const name = url.searchParams.get("name") || undefined;
    const sendTestEmail = url.searchParams.get("sendTestEmail") !== "false"; // default true
    const subscribeNewsletter = url.searchParams.get("subscribeNewsletter") !== "false"; // default true
    const subscribeReceipts = url.searchParams.get("subscribeReceipts") === "true"; // default false

    const results: Record<string, unknown> = {
      diagnostics: {
        hasNewsletterGroup: !!getDefaultNewsletterGroupId(),
        hasReceiptsGroup: !!getDefaultReceiptsGroupId()
      }
    };

    if (email) {
      if (sendTestEmail) {
        try {
          await sendEmail("Test: Elchef.se e-post (GET)", `<div>Hej ${name || ''}! Detta är ett test (GET).</div>`, { email, name });
          results.sendEmail = "ok";
        } catch (e) {
          console.error("[email-test][GET] sendEmail failed", e);
          results.sendEmail = String(e instanceof Error ? e.message : e);
        }
      }

      if (subscribeNewsletter) {
        try {
          await addToNewsletter({ email, name }, getDefaultNewsletterGroupId());
          results.subscribeNewsletter = "ok";
        } catch (e) {
          console.error("[email-test][GET] subscribeNewsletter failed", e);
          results.subscribeNewsletter = String(e instanceof Error ? e.message : e);
        }
      }

      if (subscribeReceipts) {
        try {
          await addToNewsletter({ email, name }, getDefaultReceiptsGroupId());
          results.subscribeReceipts = "ok";
        } catch (e) {
          console.error("[email-test][GET] subscribeReceipts failed", e);
          results.subscribeReceipts = String(e instanceof Error ? e.message : e);
        }
      }
    } else {
      results.note = "Provide ?email=... to execute actions";
    }

    console.log("[email-test][GET] results", results);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("[email-test][GET] error", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


