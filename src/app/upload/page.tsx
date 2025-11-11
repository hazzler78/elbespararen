"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, FileText, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import UploadCard from "@/components/UploadCard";
import { BillData } from "@/lib/types";

type ExampleImage = {
  src: string;
  alt: string;
  caption: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<ExampleImage | null>(null);

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

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage]);

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
            Ta en skärmbild eller ett foto av din elräkning. Vår AI analyserar den på några sekunder.
          </p>
        </motion.div>

        {/* Example Images Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {/* Good Example */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3 text-green-600 flex items-center justify-center gap-2">
                <span className="text-2xl">✓</span>
                Bra exempel
              </h3>
              <div className="bg-white rounded-lg border-2 border-green-200 p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImage({
                      src: "/good-invoice-example.jpg",
                      alt: "Bra exempel på faktura",
                      caption: "Bra exempel – tydlig faktura med elhandel och specifikationer",
                    })
                  }
                  aria-label="Förstora bra fakturaexempel"
                  className="block w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                >
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img 
                      src="/good-invoice-example.jpg" 
                      alt="Bra exempel på faktura" 
                      className="w-full h-full object-cover cursor-zoom-in transition-transform duration-200 hover:scale-[1.02]"
                    />
                  </div>
                </button>
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
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImage({
                      src: "/bad-invoice-example.jpg",
                      alt: "Dåligt exempel på faktura",
                      caption: "Dåligt exempel – otydlig text och bara elnät utan elhandel",
                    })
                  }
                  aria-label="Förstora dåligt fakturaexempel"
                  className="block w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                >
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img 
                      src="/bad-invoice-example.jpg" 
                      alt="Dåligt exempel på faktura" 
                      className="w-full h-full object-cover cursor-zoom-in transition-transform duration-200 hover:scale-[1.02]"
                    />
                  </div>
                </button>
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
              className="
                inline-flex items-center gap-3 px-8 py-4 
                bg-white border-2 border-primary text-primary 
                font-semibold rounded-lg 
                hover:bg-primary hover:text-white 
                active:scale-[0.98]
                shadow-sm hover:shadow-md
                transition-all duration-200
                group
              "
            >
              <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>Se avtal utan faktura</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-sm text-muted mt-3">
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
                <span>Vi hittar alla avgifter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Du får en tydlig rapport med besparingspotential</span>
              </li>
            </ul>
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedImage && (
            <motion.div
              key="image-modal"
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              role="dialog"
              aria-modal="true"
              aria-label={selectedImage.alt}
            >
              <motion.div
                className="relative max-w-4xl w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  aria-label="Stäng bild"
                  className="absolute -top-2 -right-2 bg-white text-foreground rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
                />
                <p className="mt-4 text-center text-sm text-white/80">
                  {selectedImage.caption}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

