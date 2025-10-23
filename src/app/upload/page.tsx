"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import UploadCard from "@/components/UploadCard";
import { BillData } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();

  const handleUploadSuccess = (data: BillData) => {
    // Debug: logga vad som sparas
    console.log('[upload] Sparar billData:', data);
    console.log('[upload] totalAmount:', data.totalAmount);
    
    // Spara i sessionStorage för att använda på result-sidan
    if (typeof window !== "undefined") {
      sessionStorage.setItem("billData", JSON.stringify(data));
    }

    // Om confidence är hög, gå direkt till resultat
    // Annars, gå till confirm-sidan först
    if (data.confidence >= 0.7) {
      router.push("/result");
    } else {
      router.push("/confirm");
    }
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Ladda upp din elräkning
          </h1>
          <p className="text-lg text-muted">
            Ta ett foto av din elräkning. Vår AI analyserar den på några sekunder.
          </p>
        </motion.div>

        {/* Upload Card */}
        <UploadCard
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-3">Vad händer med min faktura?</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Fakturan analyseras med OpenAI Vision (GPT-4o)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Vi hittar alla avgifter, både synliga och dolda</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Dina personuppgifter raderas direkt efter analysen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Du får en tydlig rapport med besparingspotential</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

