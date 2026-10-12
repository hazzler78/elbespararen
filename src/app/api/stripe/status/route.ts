import { NextResponse } from "next/server";
import { getStripe, getStripePublishableKey } from "@/lib/stripe";

export const runtime = "edge";

/**
 * Public health check: is Stripe configured, and live vs test?
 * Does not expose secret values.
 */
export async function GET() {
  const stripe = getStripe();
  const publishable = getStripePublishableKey() || "";

  let mode: "live" | "test" | "unknown" | "missing" = "missing";
  if (publishable.startsWith("pk_live_")) mode = "live";
  else if (publishable.startsWith("pk_test_")) mode = "test";
  else if (stripe) mode = "unknown";

  return NextResponse.json({
    success: true,
    configured: Boolean(stripe),
    publishableConfigured: publishable.length > 0,
    mode,
  });
}
