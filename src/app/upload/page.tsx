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

        {/* Example Images Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 max-w-4xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Good Example */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3 text-green-600 flex items-center justify-center gap-2">
                <span className="text-2xl">✓</span>
                Bra exempel
              </h3>
              <div className="bg-white rounded-lg border-2 border-green-200 p-4 shadow-sm">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img 
                    src="/good-invoice-example.jpg" 
                    alt="Bra exempel på faktura" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted">
                  Tydlig text, rätt faktura (elhandel), visar specifikationerna
                </p>
              </div>
            </div>

            {/* Bad Example */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3 text-red-600 flex items-center justify-center gap-2">
                <span className="text-2xl">✗</span>
                Dåligt exempel
              </h3>
              <div className="bg-white rounded-lg border-2 border-red-200 p-4 shadow-sm">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img 
                    src="/bad-invoice-example.jpg" 
                    alt="Dåligt exempel på faktura" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted">
                  Otydlig text, bara elnät, elhandel saknas
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Upload Card */}
        <UploadCard
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {/* Alternative: View contracts without invoice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted">eller</span>
            </div>
          </div>
          
          <div className="mt-6">
            <Link
              href="/contracts"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Se avtal utan faktura
            </Link>
            <p className="text-sm text-muted mt-2">
              Vill du bara se tillgängliga avtal? Ange ditt postnummer.
            </p>
          </div>
        </motion.div>

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

