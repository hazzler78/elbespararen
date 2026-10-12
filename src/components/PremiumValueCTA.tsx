"use client";

import Link from "next/link";
import { Sparkles, Download, History, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";

interface PremiumValueCTAProps {
  /** Potential monthly savings from the current analysis, if known */
  potentialSavings?: number;
  /** Already premium — hide CTA */
  isPremium?: boolean;
  /** Logged-in free user vs guest */
  isLoggedIn?: boolean;
  className?: string;
}

/**
 * Conversion CTA at the moment of value (after bill analysis).
 * Free: show what Premium unlocks. Guest: account first, then Premium.
 */
export default function PremiumValueCTA({
  potentialSavings,
  isPremium = false,
  isLoggedIn = false,
  className = "",
}: PremiumValueCTAProps) {
  if (isPremium) return null;

  const savingsLine =
    typeof potentialSavings === "number" && potentialSavings > 0
      ? `Du kan spara ca ${formatCurrency(potentialSavings)}/mån — håll koll på varje faktura så du ser att besparingen blir verklig.`
      : "Spara varje analys och se hur dina elkostnader förändras över tid.";

  const href = isLoggedIn
    ? "/premium"
    : `/auth/register?callbackUrl=${encodeURIComponent("/premium")}`;

  const ctaLabel = isLoggedIn ? "Bli Premium — 99 kr/år" : "Skapa konto & bli Premium";

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-lg bg-amber-100 p-2 shrink-0">
          <Sparkles className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Lås in värdet med Premium
          </h3>
          <p className="text-sm text-gray-600 mt-1">{savingsLine}</p>
        </div>
      </div>

      <ul className="space-y-2 mb-5 text-sm text-gray-700">
        <li className="flex items-center gap-2">
          <History className="h-4 w-4 text-amber-700 shrink-0" />
          Obegränsad historik — jämför fakturor över tid
        </li>
        <li className="flex items-center gap-2">
          <Download className="h-4 w-4 text-amber-700 shrink-0" />
          Exportera analyser till CSV (för dig eller din rådgivare)
        </li>
      </ul>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-xs text-gray-500">
          Cirka 8 kr/månad · Avsluta när du vill
        </p>
      </div>
    </div>
  );
}
