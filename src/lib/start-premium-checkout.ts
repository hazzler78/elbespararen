"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { AnalyticsEvents } from "@/lib/analytics";

type AuthSession = {
  user: {
    email?: string;
    id?: string;
  };
};

/**
 * Start Stripe Checkout immediately (skips /premium page friction).
 * Returns false if the API failed (caller can fall back to /premium).
 */
export async function startPremiumCheckout(
  session: AuthSession,
  source: string
): Promise<boolean> {
  AnalyticsEvents.premiumCtaClicked(source);
  try {
    const response = await fetchWithAuth(
      "/api/stripe/create-checkout-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      session
    );
    const data = await response.json();
    if (data.success && data.url) {
      AnalyticsEvents.premiumCheckoutStarted();
      window.location.href = data.url;
      return true;
    }
    console.error("[startPremiumCheckout] failed:", data.error);
    return false;
  } catch (err) {
    console.error("[startPremiumCheckout] error:", err);
    return false;
  }
}
