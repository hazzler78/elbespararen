"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PremiumSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      // No session ID, redirect to premium page
      router.push('/premium');
      return;
    }

    // Check premium status after a short delay to allow webhook to process
    const checkPremiumStatus = async () => {
      // Wait a bit for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const response = await fetch('/api/user/info');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIsPremium(data.data.isPremium || false);
          }
        }
      } catch (error) {
        console.error("Error checking premium status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verifierar din betalning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 border border-green-200 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tack för din prenumeration!
          </h1>
          <p className="text-gray-600 mb-6">
            {isPremium 
              ? "Din Premium-prenumeration är nu aktiv. Du har tillgång till alla premium-funktioner!"
              : "Din betalning har mottagits. Din Premium-prenumeration aktiveras inom några minuter."}
          </p>
          
          {isPremium && (
            <div className="mb-6 flex items-center justify-center gap-2 text-green-700">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Premium aktivt!</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Gå till Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary border border-primary rounded-lg hover:bg-gray-50 transition-colors"
            >
              Se Premium-funktioner
            </Link>
          </div>
        </div>

        {/* What's Next */}
        <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Vad händer nu?</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Du har nu obegränsad tillgång till din fakturahistorik</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Exportera dina analyser som CSV, Excel eller PDF</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Använd avancerad benchmarking för att jämföra dina kostnader</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Få detaljerad extraavgiftsanalys och kostnadsprognoser</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
