"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import Link from "next/link";
import { BillData, SavingsCalculation } from "@/lib/types";
import { calculateSavings } from "@/lib/calculations";
import ResultSummary from "@/components/ResultSummary";
import { getPriceAreaFromPostalCode } from "@/lib/price-areas";
import ExtraFeesList from "@/components/ExtraFeesList";
import ContactForm from "@/components/ContactForm";
import ProviderComparison from "@/components/ProviderComparison";
import { AnalyticsEvents, trackPageView } from "@/lib/analytics";

export default function ResultPage() {
  const router = useRouter();
  const [billData, setBillData] = useState<BillData | null>(null);
  const [savings, setSavings] = useState<SavingsCalculation | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const contactFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Track page view
    trackPageView('/result');
    
    // Track provider comparison viewed
    AnalyticsEvents.providerComparisonViewed();
    
    // Hämta från sessionStorage
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("billData");
      if (stored) {
        const data: BillData = JSON.parse(stored);
        console.log('[result] Laddade billData från sessionStorage:', data);
        console.log('[result] totalAmount:', data.totalAmount);
        console.log('[result] extraFeesTotal:', data.extraFeesTotal);
        console.log('[result] extraFeesDetailed:', data.extraFeesDetailed);
        // Säkerställ att priceArea finns baserat på postnummer
        const ensuredArea = data.priceArea || (data.postalCode ? getPriceAreaFromPostalCode(data.postalCode) : undefined);
        const withArea = ensuredArea ? { ...data, priceArea: ensuredArea } : data;
        setBillData(withArea);
        const savingsResult = calculateSavings(withArea);
        console.log('[result] Beräknade besparingar:', savingsResult);
        console.log('[result] currentCost:', savingsResult.currentCost);
        console.log('[result] potentialSavings:', savingsResult.potentialSavings);
        console.log('[result] cheapestAlternative:', savingsResult.cheapestAlternative);
        setSavings(savingsResult);
      } else {
        // Om ingen data finns, gå tillbaka till upload
        router.push("/upload");
      }
    }
  }, [router]);

  const handleScrollToContact = () => {
    setShowContactForm(true);
    AnalyticsEvents.contactFormOpened();
  };

  useEffect(() => {
    if (showContactForm) {
      contactFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [showContactForm]);

  if (!billData || !savings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Laddar...</p>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-background py-12 px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div
            className="mb-8 flex items-center justify-between"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </Link>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.print();
                  }
                }}
                className="p-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                title="Skriv ut"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && navigator.share) {
                    navigator.share({
                      title: "Elbespararen",
                      text: `Jag kan spara ${savings.potentialSavings} kr/mån på min elräkning!`,
                      url: window.location.href
                    });
                  }
                }}
                className="p-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                title="Dela"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Result Summary */}
          <div className="mb-8">
            <ResultSummary key={`${savings.currentCost}-${savings.potentialSavings}`} savings={savings} />
          </div>

          {/* Extra Fees */}
          {billData.extraFeesDetailed.length > 0 && (
            <div
              className="mb-8 bg-white rounded-lg shadow-sm border border-border p-6"
            >
              <ExtraFeesList fees={billData.extraFeesDetailed} totalAmount={billData.extraFeesTotal} showConfidence={true} />
            </div>
          )}

          {/* Bill Details */}
          <div
            className="mb-8 bg-white rounded-lg shadow-sm border border-border p-6"
          >
            <h3 className="font-semibold text-lg mb-4">Fakturadetaljer</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted mb-1">Period</p>
                <p className="font-medium">{billData.period}</p>
              </div>
              <div>
                <p className="text-muted mb-1">Avtalstyp</p>
                <p className="font-medium capitalize">{billData.contractType}</p>
              </div>
              <div>
                <p className="text-muted mb-1">Förbrukning</p>
                <p className="font-medium">{billData.totalKWh} kWh</p>
              </div>
              <div>
                <p className="text-muted mb-1">Analysens säkerhet</p>
                <p className="font-medium">{Math.round(billData.confidence * 100)}%</p>
              </div>
            </div>
          </div>

          {/* Provider Comparison */}
          <div
            className="mb-8"
          >
            <ProviderComparison
              billData={billData}
              savings={savings}
              onRequestContact={handleScrollToContact}
              secondaryCta={{
                label: "Testa själv och jämför avtal",
                href: "/contracts"
              }}
            />
          </div>

          {/* Contact Form */}
          {showContactForm && (
            <div
              ref={contactFormRef}
              className="mb-8"
            >
              <ContactForm
                onSubmit={async (data) => {
                  try {
                    const response = await fetch('/api/leads', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        email: data.email,
                        phone: data.phone,
                        name: data.name,
                        subscribeNewsletter: !!data.subscribeNewsletter,
                        billData: billData,
                        savings: savings
                      })
                    });

                    if (!response.ok) {
                      throw new Error('Kunde inte skicka förfrågan');
                    }

                    const result = await response.json();
                    console.log("Lead skapad:", result);
                    
                    // Track lead creation
                    AnalyticsEvents.leadCreated();
                    
                    // Track newsletter subscription if applicable
                    if (data.subscribeNewsletter) {
                      AnalyticsEvents.newsletterSubscribed();
                    }
                  } catch (error) {
                    console.error("Fel vid skapande av lead:", error);
                    AnalyticsEvents.errorOccurred('lead_creation_failed');
                    throw error; // Låt ContactForm hantera felet
                  }
                }}
              />
            </div>
          )}

          {/* Info */}
          <div
            className="text-center text-sm text-muted"
          >
            <p>🔒 Din information behandlas enligt GDPR</p>
            <p className="mt-2">Analysen baseras på aktuella marknadspriser och kan variera</p>
          </div>
        </div>
      </main>
    </>
  );
}

