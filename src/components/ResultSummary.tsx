"use client";

import { SavingsCalculation } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { TrendingDown, Sparkles, Calculator } from "lucide-react";
import { useEffect, useState } from "react";

interface ResultSummaryProps {
  savings: SavingsCalculation;
}

export default function ResultSummary({ savings }: ResultSummaryProps) {
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
        <p className="text-muted">Baserat på AI-analys av din faktura</p>
      </div>

      {/* Huvudsiffra - Besparing */}
      <div
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 mb-6 text-center border-2 border-primary/20"
      >
        <p className="text-sm uppercase tracking-wide text-primary mb-2">Du kan spara upp till</p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <TrendingDown className="w-8 h-8 text-primary" />
          <p className="text-5xl font-bold text-primary">{formatCurrency(potentialSavings * 12)}</p>
        </div>
        <p className="text-lg text-muted">
          per år ({savingsPercentage}% lägre) inkl. moms
        </p>
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
          <p className="text-xs text-muted mt-1">med spotpris + minimal avgift</p>
        </div>
      </div>

      {/* Info-box */}
      <div
        className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10"
      >
        <p className="text-xs text-muted text-center">
          💡 <strong>Obs!</strong> Elnätkostnader är ej inkluderade i besparingen eftersom de inte går att påverka.
          Beräkningar baseras på AI-analys och kan variera från faktiska priser.
        </p>
      </div>
    </div>
  );
}

