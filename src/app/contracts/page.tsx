"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import PostalCodeInput from "@/components/PostalCodeInput";
import ProviderComparison from "@/components/ProviderComparison";
import ContactForm from "@/components/ContactForm";
import { BillData, SavingsCalculation } from "@/lib/types";
import { calculateSavings } from "@/lib/calculations";


export default function ContractsPage() {
  const router = useRouter();
  const [postalCode, setPostalCode] = useState("");
  const [priceArea, setPriceArea] = useState<string | null>(null);
  const [showContracts, setShowContracts] = useState(false);
  const contactFormRef = useRef<HTMLDivElement>(null);

  const handlePostalCodeChange = (code: string, area: string | null) => {
    setPostalCode(code);
    setPriceArea(area);
  };

  const handleViewContracts = () => {
    if (priceArea) {
      setShowContracts(true);
    }
  };

  const handleScrollToContact = () => {
    contactFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Skapa mock data för att visa avtal baserat på postnummer
  const createMockBillData = (area: string): BillData => {
    return {
      elnatCost: 200, // Nätavgift
      elhandelCost: 800, // Elhandelskostnad
      totalAmount: 1200, // Total belopp
      totalKWh: 400, // Exempel förbrukning
      period: "2024-01-01 - 2024-01-31",
      contractType: "rörligt",
      extraFeesTotal: 150,
      extraFeesDetailed: [
        {
          label: "Nätavgift",
          amount: 100,
          confidence: 0.9
        },
        {
          label: "Energiskatt",
          amount: 50,
          confidence: 0.9
        }
      ],
      confidence: 0.8,
      priceArea: area,
      postalCode: postalCode
    };
  };

  const mockBillData = priceArea ? createMockBillData(priceArea) : null;
  const savings = mockBillData ? calculateSavings(mockBillData) : null;

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <div
          className="mb-8"
        >
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Link>
        </div>

        {/* Header */}
        <div
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Se tillgängliga elavtal
          </h1>
          <p className="text-lg text-muted">
            Ange ditt postnummer för att se de bästa elavtalen i ditt område.
          </p>
        </div>

        {!showContracts ? (
          /* Postal Code Input */
          <div
            className="max-w-md mx-auto"
          >
            <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
              <div className="text-center mb-6">
                <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Var bor du?</h2>
                <p className="text-muted text-sm">
                  Vi behöver ditt postnummer för att visa rätt priser för ditt område.
                </p>
                <p className="text-xs text-red-600 mt-2 font-medium">
                  * Postnummer är obligatoriskt
                </p>
              </div>

              <PostalCodeInput
                value={postalCode}
                onChange={handlePostalCodeChange}
                className="mb-6"
              />

              <button
                onClick={handleViewContracts}
                disabled={!priceArea || postalCode.length === 0}
                className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {!postalCode ? 'Ange postnummer först' : !priceArea ? 'Ogiltigt postnummer' : 'Visa avtal för mitt område'}
              </button>
            </div>
          </div>
        ) : (
          /* Contracts Display */
          <div
          >
            {/* Area Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">
                    Visar avtal för {postalCode}
                  </p>
                  <p className="text-sm text-blue-600">
                    Ange din förbrukning nedan för att se exakta priser
                  </p>
                </div>
              </div>
            </div>

            {/* Provider Comparison - "Bästa alternativen" is sticky when scrolling */}
            {mockBillData && savings && (
              <ProviderComparison 
                billData={mockBillData} 
                savings={savings} 
                hideSavings={true}
                enableConsumptionEntry={true}
                onRequestContact={handleScrollToContact}
                secondaryCta={{
                  label: "Ladda upp min faktura",
                  href: "/upload"
                }}
              />
            )}

            {/* Contact Form */}
            <div
              ref={contactFormRef}
              className="mt-8"
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
                        billData: mockBillData,
                        savings: savings
                      })
                    });

                    if (!response.ok) {
                      throw new Error('Kunde inte skicka förfrågan');
                    }

                    const result = await response.json();
                    console.log("Lead skapad:", result);
                  } catch (error) {
                    console.error("Fel vid skapande av lead:", error);
                    throw error; // Låt ContactForm hantera felet
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Info */}
        <div
          className="mt-12 text-center text-sm text-muted"
        >
          <p>🔒 Din information behandlas enligt GDPR</p>
          <p className="mt-2">Priser baseras på aktuella marknadspriser och kan variera</p>
        </div>
      </div>
      </main>
  );
}
