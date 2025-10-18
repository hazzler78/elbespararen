"use client";

import { ExtraFeeDetailed } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import ConfidenceBadge from "./ConfidenceBadge";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ExtraFeesListProps {
  fees: ExtraFeeDetailed[];
  showConfidence?: boolean;
}

export default function ExtraFeesList({ fees, showConfidence = true }: ExtraFeesListProps) {
  if (fees.length === 0) {
    return (
      <div className="p-6 text-center text-muted">
        <p className="text-sm">Inga extra avgifter hittades 🎉</p>
      </div>
    );
  }

  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="font-semibold text-lg">Dolda avgifter & tillägg</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-error">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-muted">per månad</p>
        </div>
      </div>

      {/* Lista över avgifter */}
      <div className="space-y-2">
        {fees.map((fee, index) => (
          <motion.div
            key={`${fee.label}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
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
              <p className="font-semibold text-lg">{formatCurrency(fee.amount)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Varning om låg confidence */}
      {fees.some(fee => fee.confidence < 0.7) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg"
        >
          <p className="text-xs text-warning flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Vissa avgifter har lägre säkerhet och kan behöva verifieras manuellt.
          </p>
        </motion.div>
      )}
    </div>
  );
}

