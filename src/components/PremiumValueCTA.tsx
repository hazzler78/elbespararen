"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Download, History, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { AnalyticsEvents } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";
import { startPremiumCheckout } from "@/lib/start-premium-checkout";
import {
  PREMIUM_PRICE_CTA,
  PREMIUM_PRICE_MONTHLY_HINT,
} from "@/lib/premium-pricing";

interface PremiumValueCTAProps {
  /** Potential monthly savings from the current analysis, if known */
  potentialSavings?: number;
  /** Already premium — hide CTA */
  isPremium?: boolean;
  /** Logged-in free user vs guest */
  isLoggedIn?: boolean;
  /** Free save limit hit — stronger conversion copy */
  accountSaveBlocked?: boolean;
  accountSaveLimit?: number;
  className?: string;
}

/**
 * Conversion CTA at the moment of value (after bill analysis).
 * Free: show what Premium unlocks. Guest: account first, then Premium.
 * Logged-in: go straight to Stripe Checkout when possible.
 */
export default function PremiumValueCTA({
  potentialSavings,
  isPremium = false,
  isLoggedIn = false,
  accountSaveBlocked = false,
  accountSaveLimit = 2,
  className = "",
}: PremiumValueCTAProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  if (isPremium) return null;

  const savingsLine = accountSaveBlocked
    ? `Gratisplanen sparar max ${accountSaveLimit} fakturor på kontot. Den här analysen visas nu — Premium sparar den och alla kommande.`
    : typeof potentialSavings === "number" && potentialSavings > 0
      ? `Du kan spara ca ${formatCurrency(potentialSavings)}/mån — håll koll på varje faktura så du ser att besparingen blir verklig.`
      : "Spara varje analys och se hur dina elkostnader förändras över tid.";

  const registerHref = `/auth/register?callbackUrl=${encodeURIComponent("/premium")}`;
  const ctaLabel = isLoggedIn
    ? starting
      ? "Öppnar betalning…"
      : PREMIUM_PRICE_CTA
    : "Skapa konto & bli Premium";
  const title = accountSaveBlocked
    ? "Du har nått gratisgränsen"
    : "Lås in värdet med Premium";

  const source = accountSaveBlocked
    ? "result_save_limit"
    : isLoggedIn
      ? "result_logged_in"
      : "result_guest";

  const handleClick = async () => {
    if (!isLoggedIn || !user?.email) {
      AnalyticsEvents.premiumCtaClicked(source);
      router.push(registerHref);
      return;
    }
    setStarting(true);
    const ok = await startPremiumCheckout(
      { user: { email: user.email, id: user.id } },
      source
    );
    if (!ok) {
      setStarting(false);
      router.push("/premium");
    }
  };

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-lg bg-amber-100 p-2 shrink-0">
          <Sparkles className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{savingsLine}</p>
        </div>
      </div>

      <ul className="space-y-2 mb-5 text-sm text-gray-700">
        <li className="flex items-center gap-2">
          <History className="h-4 w-4 text-amber-700 shrink-0" />
          Obegränsat antal sparade fakturor + historik över tid
        </li>
        <li className="flex items-center gap-2">
          <Download className="h-4 w-4 text-amber-700 shrink-0" />
          Exportera analyser till CSV (för dig eller din rådgivare)
        </li>
      </ul>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={starting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-xs text-gray-500">
          {PREMIUM_PRICE_MONTHLY_HINT} · Avsluta när du vill
          {isLoggedIn && (
            <>
              {" · "}
              <Link href="/premium" className="underline hover:no-underline">
                mer info
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
