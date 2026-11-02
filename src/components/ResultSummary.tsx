"use client";

import Link from "next/link";
import { SavingsCalculation } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { TrendingDown, Sparkles, Calculator, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ResultSummaryProps {
  savings: SavingsCalculation;
  /** Opens the recommended switch path (e.g. Cheap Energy SaleSys form) */
  onPrimaryCta?: () => void;
  /** True when AI found no savable fees — often missing elhandel page */
  missingFeesHint?: boolean;
}

export default function ResultSummary({ savings, onPrimaryCta, missingFeesHint }: ResultSummaryProps) {
  const [displaySavings, setDisplaySavings] = useState<SavingsCalculation | null>(null);
  
  // Debug log för att se vad som kommer in
  console.log('[ResultSummary] Received savings:', savings);
  
  // Force update när savings ändras
  useEffect(() => {
    setDisplaySavings(savings);
  }, [savings]);
  
  if (!displaySavings) return null;
  
  const { currentCost, cheapestAlternative, potentialSavings, savingsPercentage } = displaySavings;
  
  // Debug log för att se vad som visas i UI
  console.log('[ResultSummary] Displaying:', { currentCost, cheapestAlternative, potentialSavings, savingsPercentage });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border p-8">
      {/* Huvudrubrik */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Din besparingspotential</h2>
        <p className="text-muted">Från avgifter du kan slippa genom att byta elhandlare</p>
      </div>

      {/* 0 kr oftast = fel/ofullständig sida, inte "du har inga avgifter" */}
      {missingFeesHint && potentialSavings <= 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-950">
            <p className="font-semibold mb-1">Hittade inga onödiga avgifter på bilden</p>
            <p className="mb-2">
              Elnät och elhandel ligger ofta på olika sidor. Ladda upp 1–3 sidor — särskilt
              sidan med <strong>Rörliga kostnader</strong>, <strong>Fast påslag</strong> och{" "}
              <strong>årsavgift</strong> (vanligt hos E.ON m.fl.).
            </p>
            <Link
              href="/upload"
              className="inline-flex font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
            >
              Analysera igen med fler sidor
            </Link>
          </div>
        </div>
      )}

      {/* Huvudsiffra - Besparing */}
      <div
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 mb-6 text-center border-2 border-primary/20"
      >
        <p className="text-lg font-semibold text-primary mb-4">Uppskattad besparing</p>
        <div className="flex flex-col items-center gap-2 mb-3">
          <p className="text-2xl md:text-3xl font-bold text-primary leading-tight">
            Upp till{" "}
            <span className="text-4xl md:text-5xl">{formatCurrency(potentialSavings * 12)}</span>
            /år i onödiga avgifter
          </p>
        </div>
        <p className="text-base text-muted mb-6">
          ({savingsPercentage}% av fakturan) inkl. moms
        </p>
        {onPrimaryCta ? (
          <button
            type="button"
            onClick={onPrimaryCta}
            className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Byt elavtal — spara upp till {formatCurrency(potentialSavings * 12)}/år
          </button>
        ) : (
          <a
            href="#byt-avtal"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Byt elavtal — spara upp till {formatCurrency(potentialSavings * 12)}/år
          </a>
        )}
      </div>

      {/* Detaljerad uppdelning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nuvarande kostnad */}
        <div
          className="p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-muted" />
            <p className="text-sm text-muted uppercase tracking-wide">Din nuvarande kostnad</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(currentCost)}</p>
          <p className="text-xs text-muted mt-1">inkl. moms per månad</p>
        </div>

        {/* Billigaste alternativ */}
        <div
          className="p-4 bg-primary/5 rounded-lg border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm text-primary uppercase tracking-wide font-medium">Billigaste alternativ</p>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(cheapestAlternative)}</p>
          <p className="text-xs text-muted mt-1">inkl. moms per månad</p>
        </div>
      </div>

      {/* Info-box */}
      <div
        className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10"
      >
        <p className="text-xs text-muted text-center">
          Elnät, skatt och spotpris räknas inte — bara påslag och tilläggsavgifter hos elhandlaren.
          Exakt besparing vid byte visas i avtalsjämförelsen nedan.
        </p>
      </div>
    </div>
  );
}

