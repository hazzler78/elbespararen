"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { BillData } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import ConfidenceBadge from "@/components/ConfidenceBadge";

export default function ConfirmPage() {
  const router = useRouter();
  const [billData, setBillData] = useState<BillData | null>(null);

  useEffect(() => {
    // Hämta från sessionStorage
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("billData");
      if (stored) {
        setBillData(JSON.parse(stored));
      } else {
        // Om ingen data finns, gå tillbaka till upload
        router.push("/upload");
      }
    }
  }, [router]);

  const handleConfirm = () => {
    router.push("/result");
  };

  const handleReject = () => {
    router.push("/upload");
  };

  if (!billData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Laddar...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Warning header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/10 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Bekräfta analysen</h1>
          <p className="text-muted">
            AI:n hade lite svårt att läsa vissa delar. Kontrollera att informationen stämmer.
          </p>
        </motion.div>

        {/* Bill summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-border p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Analyserad information</h2>
            <ConfidenceBadge confidence={billData.confidence} />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted mb-1">Elnät</p>
                <p className="text-xl font-semibold">{formatCurrency(billData.elnatCost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Elhandel</p>
                <p className="text-xl font-semibold">{formatCurrency(billData.elhandelCost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Extra avgifter</p>
                <p className="text-xl font-semibold text-error">{formatCurrency(billData.extraFeesTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Förbrukning</p>
                <p className="text-xl font-semibold">{billData.totalKWh} kWh</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted mb-1">Period</p>
              <p className="font-medium">{billData.period}</p>
            </div>

            <div>
              <p className="text-sm text-muted mb-1">Avtalstyp</p>
              <p className="font-medium capitalize">{billData.contractType}</p>
            </div>
          </div>

          {/* Warnings */}
          {billData.warnings && billData.warnings.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium text-warning mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Varningar
              </p>
              <ul className="space-y-1">
                {billData.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-muted">• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={handleReject}
            className="flex-1 py-3 px-6 bg-white border border-border text-foreground font-semibold rounded-lg hover:bg-gray-50 transition-all"
          >
            Ladda upp igen
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            Ser bra ut, fortsätt
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-lg"
        >
          <p className="text-sm text-muted text-center">
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Om informationen är korrekt, fortsätt för att se din besparingspotential.
          </p>
        </motion.div>
      </div>
    </main>
  );
}

