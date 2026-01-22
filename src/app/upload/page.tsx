"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, ArrowRight, X, CheckCircle2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import UploadCard from "@/components/UploadCard";
import AppHeader from "@/components/AppHeader";
import { BillData } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

type ExampleImage = {
  src: string;
  alt: string;
  caption: string;
};

function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<ExampleImage | null>(null);
  const [showBillAlreadySaved, setShowBillAlreadySaved] = useState(false);
  const hasProcessedPendingRef = useRef(false);

  const handleUploadSuccess = useCallback((data: BillData) => {
    // Debug: logga vad som sparas
    console.log('[upload] handleUploadSuccess anropad med:', {
      totalAmount: data.totalAmount,
      confidence: data.confidence,
      postalCode: data.postalCode
    });
    
    // Spara i sessionStorage för att använda på result-sidan
    if (typeof window !== "undefined") {
      sessionStorage.setItem("billData", JSON.stringify(data));
      sessionStorage.removeItem("pendingAnalysis"); // Rensa pending flag
      console.log('[upload] billData sparad i sessionStorage');
    }

    // Om confidence är hög, gå direkt till resultat
    // Annars, gå till confirm-sidan först
    if (data.confidence >= 0.7) {
      console.log('[upload] Redirectar till /result');
      router.push("/result");
    } else {
      console.log('[upload] Redirectar till /confirm');
      router.push("/confirm");
    }
  }, [router]);

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
  };

  // Kolla om det finns en pending analysis när sidan laddas (användaren kom tillbaka från registrering/premium)
  useEffect(() => {
    // Förhindra dubbel körning
    if (hasProcessedPendingRef.current) {
      return;
    }

    if (authLoading || typeof window === "undefined") {
      console.log('[upload] useEffect: Väntar på auth eller window är undefined');
      return;
    }

    console.log('[upload] useEffect: Kontrollerar pending analysis...');
    console.log('[upload] authLoading:', authLoading);
    console.log('[upload] user:', user ? `${user.email} (${user.id})` : 'null');

    // Kolla både sessionStorage och URL-parametrar för pendingAnalysis
    const pendingAnalysisFromStorage = typeof window !== "undefined" ? sessionStorage.getItem("pendingAnalysis") : null;
    const pendingAnalysisFromUrl = searchParams.get("pendingAnalysis");
    const pendingAnalysis = pendingAnalysisFromStorage === "true" || pendingAnalysisFromUrl === "1";
    
    // Kolla cookie först (överlever OAuth-redirects bäst), sedan localStorage, sedan sessionStorage
    let billDataFromCookie: string | null = null;
    if (typeof window !== "undefined") {
      const cookies = document.cookie.split(';');
      const pendingBillDataCookie = cookies.find(c => c.trim().startsWith('pendingBillData='));
      if (pendingBillDataCookie) {
        billDataFromCookie = decodeURIComponent(pendingBillDataCookie.split('=')[1]);
      }
    }
    const billDataFromLocalStorage = typeof window !== "undefined" ? localStorage.getItem("pendingBillData") : null;
    const billDataFromSessionStorage = typeof window !== "undefined" ? sessionStorage.getItem("billData") : null;
    const billData = billDataFromCookie || billDataFromLocalStorage || billDataFromSessionStorage;
    
    console.log('[upload] pendingAnalysis från sessionStorage:', pendingAnalysisFromStorage);
    console.log('[upload] pendingAnalysis från URL:', pendingAnalysisFromUrl);
    console.log('[upload] pendingAnalysis (kombinerad):', pendingAnalysis);
    console.log('[upload] billData från cookie:', !!billDataFromCookie);
    console.log('[upload] billData från localStorage:', !!billDataFromLocalStorage);
    console.log('[upload] billData från sessionStorage:', !!billDataFromSessionStorage);
    console.log('[upload] billData (kombinerad):', !!billData);
    
    // Om pendingAnalysis finns i URL men inte i sessionStorage, sätt den i sessionStorage
    if (pendingAnalysisFromUrl === "1" && pendingAnalysisFromStorage !== "true" && typeof window !== "undefined") {
      console.log('[upload] Sätter pendingAnalysis i sessionStorage från URL-parameter');
      sessionStorage.setItem("pendingAnalysis", "true");
    }
    
    // ENDAST om pendingAnalysis är true ska vi spara fakturan
    // Detta betyder att användaren kom tillbaka från registrering/premium
    if (pendingAnalysis && billData && user) {
      hasProcessedPendingRef.current = true; // Markera som processad
      
      let data: BillData;
      try {
        data = JSON.parse(billData);
        console.log('[upload] billData parsad:', {
          totalAmount: data.totalAmount,
          confidence: data.confidence,
          postalCode: data.postalCode
        });
      } catch (error) {
        console.error('[upload] ❌ Kunde inte parsa billData:', error);
        return;
      }

      console.log('[upload] ✅ Processar pending analysis - användaren kom tillbaka från registrering/premium');
      console.log('[upload] Sparar faktura med user_id och visar resultat');
      
      fetch('/api/user/save-pending-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ billData: data }),
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            console.log('[upload] ✅ Faktura sparad med user_id:', result.data?.userId);
          } else {
            console.error('[upload] ❌ Kunde inte spara faktura:', result.error);
          }
          // Visa resultatet oavsett om sparandet lyckades eller inte
          // Rensa cookie, localStorage och sessionStorage
          if (typeof window !== "undefined") {
            // Rensa cookie
            document.cookie = "pendingBillData=; path=/; max-age=0";
            sessionStorage.removeItem("pendingAnalysis");
            localStorage.removeItem("pendingBillData");
            sessionStorage.removeItem("billData");
          }
          handleUploadSuccess(data);
        })
        .catch(error => {
          console.error('[upload] ❌ Fel vid sparande av faktura:', error);
          // Visa resultatet ändå
          // Rensa cookie, localStorage och sessionStorage
          if (typeof window !== "undefined") {
            // Rensa cookie
            document.cookie = "pendingBillData=; path=/; max-age=0";
            sessionStorage.removeItem("pendingAnalysis");
            localStorage.removeItem("pendingBillData");
            sessionStorage.removeItem("billData");
          }
          handleUploadSuccess(data);
        });
    } else if (pendingAnalysis && billData && !user) {
      // Om användaren inte är inloggad ännu men pendingAnalysis finns, vänta
      console.log('[upload] ⚠️ Användare är inte inloggad ännu, väntar...');
      return;
    } else {
      // Om pendingAnalysis finns men billData saknas, betyder det att:
      // 1. Fakturan redan är sparad (användaren kom tillbaka efter OAuth-redirect)
      // 2. Eller det är gammal data som ska rensas
      if (pendingAnalysis && !billData && typeof window !== "undefined") {
        console.log('[upload] ⚠️ pendingAnalysis finns men billData saknas - fakturan är redan sparad eller gammal data');
        console.log('[upload] Rensar pendingAnalysis flagga och alla storage-locations');
        // Rensa alla pending flags och data
        document.cookie = "pendingBillData=; path=/; max-age=0";
        sessionStorage.removeItem("pendingAnalysis");
        localStorage.removeItem("pendingBillData");
        sessionStorage.removeItem("billData");
        hasProcessedPendingRef.current = true; // Markera som processad
        
        // Om användaren är inloggad, fakturan är förmodligen redan sparad
        if (user) {
          console.log('[upload] ✅ Användaren är inloggad - fakturan är redan sparad i databasen');
          console.log('[upload] 💡 Tips: Kolla ditt dashboard för att se fakturan');
          // Visa meddelande att fakturan är sparad
          setShowBillAlreadySaved(true);
        }
      }
      
      // Om användaren bara navigerar till upload-sidan (inte från registrering),
      // rensa gammal billData från cookie, localStorage och sessionStorage för att undvika förvirring
      if (billData && !pendingAnalysis && typeof window !== "undefined") {
        console.log('[upload] Rensar gammal billData från cookie, localStorage och sessionStorage (användaren navigerade hit, inte från registrering)');
        document.cookie = "pendingBillData=; path=/; max-age=0";
        localStorage.removeItem("pendingBillData");
        sessionStorage.removeItem("billData");
        hasProcessedPendingRef.current = true; // Markera som processad efter rensning
      }
      
      // Rensa pendingAnalysis från URL om den finns där
      if (pendingAnalysisFromUrl === "1" && typeof window !== "undefined") {
        console.log('[upload] Rensar pendingAnalysis från URL');
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("pendingAnalysis");
        window.history.replaceState({}, "", newUrl.toString());
      }
      
      console.log('[upload] ⚠️ Ingen pending analysis hittades');
      if (!pendingAnalysis) {
        console.log('[upload] pendingAnalysis är inte true');
      }
      if (!billData) {
        console.log('[upload] billData saknas i alla storage-locations');
      }
      if (!user) {
        console.log('[upload] Användare är inte inloggad');
      }
    }
  }, [authLoading, user, handleUploadSuccess, searchParams]);

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
    <>
      <AppHeader showBackButton={true} backHref="/" />
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">

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

        {/* Bill Already Saved Message */}
        <AnimatePresence>
          {showBillAlreadySaved && user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Din faktura är redan sparad!
                    </h3>
                    <p className="text-green-800 mb-4">
                      Eftersom du redan är inloggad sparades fakturan automatiskt när den analyserades. 
                      Du kan se den på ditt dashboard.
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Gå till Mitt Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alternative: View contracts without invoice - Moved up */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center"
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

        {/* Upload Card */}
        <UploadCard
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          isUserLoggedIn={!!user}
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
                <span>Vi hittar alla avgifter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Du får en tydlig rapport med besparingspotential</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Example Images Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 max-w-4xl mx-auto"
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
    </>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <UploadPageContent />
    </Suspense>
  );
}

