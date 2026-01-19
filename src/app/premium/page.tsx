"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  TrendingUp, 
  Download, 
  BarChart3, 
  Target,
  CheckCircle2,
  ArrowRight,
  Zap
} from "lucide-react";
import Link from "next/link";

export default function PremiumPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/premium")}`);
      return;
    }

    if (status === "authenticated" && session) {
      fetchUserInfo();
    }
  }, [status, session, router]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user/info');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsPremium(data.data.isPremium || false);
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-8 border border-yellow-200 text-center">
            <Sparkles className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Du har redan Premium!</h1>
            <p className="text-gray-600 mb-6">
              Du har tillgång till alla premium-funktioner.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Gå till Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Uppgradera till Premium</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Få tillgång till avancerad analys, obegränsad historik och export-funktioner
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white rounded-xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gratis</h2>
            <p className="text-4xl font-bold text-gray-900 mb-6">0 kr/månad</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Grundläggande dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Fakturaanalys</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Senaste 3 månaderna</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">Export-funktioner</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">Avancerad benchmarking</span>
              </li>
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-primary to-primary/90 text-white rounded-xl p-8 border-2 border-primary shadow-lg relative">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
              POPULÄR
            </div>
            <h2 className="text-2xl font-bold mb-2">Premium</h2>
            <p className="text-4xl font-bold mb-2">99 kr/år</p>
            <p className="text-sm text-white/80 mb-1">Cirka 8 kr/månad</p>
            <p className="text-xs text-white/70 mb-6">Introduktionspris - kan höjas senare</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                <span>Allt i Gratis-planen</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                <span>Obegränsad historik</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                <span>Export till CSV, Excel & PDF</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                <span>Avancerad benchmarking</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                <span>Detaljerad extraavgiftsanalys</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                <span>Kostnadsprognoser</span>
              </li>
            </ul>
            <button
              onClick={() => {
                // TODO: Implement Stripe checkout
                alert("Betalningsintegration kommer snart!");
              }}
              className="w-full bg-white text-primary font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              Uppgradera nu
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Premium-funktioner</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Download className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Export-funktioner</h3>
              <p className="text-sm text-gray-600">
                Exportera alla dina analyser som CSV, Excel eller PDF för egen analys eller delning.
              </p>
            </div>
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Avancerad benchmarking</h3>
              <p className="text-sm text-gray-600">
                Jämför med andra i samma postnummer eller med liknande förbrukning.
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Kostnadsprognoser</h3>
              <p className="text-sm text-gray-600">
                Få förutsägelser om framtida kostnader baserat på din historik.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
