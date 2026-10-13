"use client";

import { ExtraFeeDetailed } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { filterSavableFees } from "@/lib/fee-classification";
import ConfidenceBadge from "./ConfidenceBadge";
import { AlertTriangle } from "lucide-react";

interface ExtraFeesListProps {
  fees: ExtraFeeDetailed[];
  totalAmount?: number; // Total belopp från extraFeesTotal
  showConfidence?: boolean;
}

export default function ExtraFeesList({ fees, totalAmount, showConfidence = true }: ExtraFeesListProps) {
  // Visa endast avgifter som går att spara bort (ej nät/skatt)
  const savableFees = filterSavableFees(fees);

  if (savableFees.length === 0) {
    return (
      <div className="p-6 text-center text-muted">
        <p className="text-sm">Inga onödiga elhandelsavgifter hittades</p>
      </div>
    );
  }

  // Använd summan av fees och lägg till moms (25%) för konsumentvisning
  const displayTotal = savableFees.reduce((sum, fee) => sum + fee.amount, 0) * 1.25;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="font-semibold text-lg">Extra avgifter & tillägg</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-error">{formatCurrency(displayTotal)}</p>
          <p className="text-xs text-muted">inkl. moms per månad</p>
        </div>
      </div>

      {/* Lista över avgifter */}
      <div className="space-y-2">
        {savableFees.map((fee, index) => (
          <div
            key={`${fee.label}-${index}`}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {fee.confidence < 0.7 && (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                )}
                <p className="font-medium">{fee.label}</p>
              </div>
              {showConfidence && (
                <ConfidenceBadge confidence={fee.confidence} showLabel={false} size="sm" />
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">{formatCurrency(fee.amount * 1.25)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Varning om låg confidence */}
      {savableFees.some(fee => fee.confidence < 0.7) && (
        <div
          className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg"
        >
          <p className="text-xs text-warning flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Vissa avgifter har lägre säkerhet och kan behöva verifieras manuellt.
          </p>
        </div>
      )}
    </div>
  );
}

