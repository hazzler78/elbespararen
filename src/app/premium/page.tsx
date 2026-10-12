"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Download,
  History,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import AppHeader from "@/components/AppHeader";
import { AnalyticsEvents } from "@/lib/analytics";

export default function PremiumPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    AnalyticsEvents.premiumPageViewed();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("canceled") === "true") {
      setCanceled(true);
    }
    const utm = urlParams.get("utm_campaign") || urlParams.get("utm_source");
    if (utm) {
      AnalyticsEvents.premiumCtaClicked(`utm_${utm}`);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    fetchUserInfo();
  }, [authLoading, user]);

  const fetchUserInfo = async () => {
    if (!user) return;

    try {
      const session = {
        user: {
          email: user.email || undefined,
          id: user.id,
        },
      };

      const response = await fetchWithAuth("/api/user/info", {}, session);
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

  const handleUpgrade = async () => {
    if (!user?.email) {
      router.push(
        `/auth/register?callbackUrl=${encodeURIComponent("/premium")}`
      );
      return;
    }

    setIsCreatingCheckout(true);
    AnalyticsEvents.premiumCtaClicked("premium_page");
    try {
      const session = {
        user: {
          email: user.email || undefined,
          id: user.id,
        },
      };

      const response = await fetchWithAuth(
        "/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
        session
      );

      const data = await response.json();

      if (data.success && data.url) {
        AnalyticsEvents.premiumCheckoutStarted();
        window.location.href = data.url;
      } else {
        alert(
          data.error ||
            "Kunde inte skapa checkout-session. Försök igen senare."
        );
        setIsCreatingCheckout(false);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Ett fel uppstod. Försök igen senare.");
      setIsCreatingCheckout(false);
    }
  };

  if (authLoading || (user && isLoading)) {
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
      <>
        <AppHeader />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-8 border border-amber-200 text-center">
              <Sparkles className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Du har redan Premium!
              </h1>
              <p className="text-gray-600 mb-6">
                Du har obegränsad historik och kan exportera dina analyser.
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
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-primary text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Premium — 99 kr/år
            </h1>
            <p className="text-lg text-white/90 max-w-xl mx-auto">
              Spara varje fakturaanalys, följ kostnaden över tid och exportera
              när du vill. Cirka 8 kr/månad.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {canceled && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Betalningen avbröts. Du kan försöka igen när du är redo — inget har
              dragits.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Gratis</h2>
              <p className="text-3xl font-bold text-gray-900 mb-5">0 kr</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>AI-analys av elräkning</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Spara upp till 2 fakturor + 3 månaders vy</span>
                </li>
                <li className="flex items-start gap-2 text-gray-400">
                  <X className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Obegränsat antal sparade fakturor</span>
                </li>
                <li className="flex items-start gap-2 text-gray-400">
                  <X className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Längre historik &amp; CSV-export</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-primary shadow-md relative">
              <div className="absolute -top-3 right-4 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-full">
                99 kr/år
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Premium</h2>
              <p className="text-3xl font-bold text-gray-900 mb-1">99 kr/år</p>
              <p className="text-xs text-gray-500 mb-5">Introduktionspris</p>
              <ul className="space-y-3 text-sm mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Allt i gratisplanen</span>
                </li>
                <li className="flex items-start gap-2">
                  <History className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>
                    <strong>Obegränsat sparande</strong> + historik (år / all tid)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Download className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>
                    <strong>CSV-export</strong> av dina analyser
                  </span>
                </li>
              </ul>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isCreatingCheckout}
                className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreatingCheckout
                  ? "Laddar..."
                  : user
                    ? "Uppgradera nu — 99 kr/år"
                    : "Skapa konto & uppgradera"}
                {!isCreatingCheckout && <ArrowRight className="w-5 h-5" />}
              </button>
              <p className="mt-3 text-center text-xs text-gray-500">
                Säker betalning via Stripe · Avsluta när du vill · Inga dolda avgifter
              </p>
              {!user && (
                <p className="mt-2 text-center text-xs text-gray-500">
                  Redan konto?{" "}
                  <Link
                    href={`/auth/signin?callbackUrl=${encodeURIComponent("/premium")}`}
                    className="text-primary underline"
                  >
                    Logga in
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 text-sm text-gray-600 mb-6">
            <p className="font-medium text-gray-900 mb-2">Vad du betalar för</p>
            <p>
              Gratis ger dig en stark analys av varje faktura. Premium är till
              för dig som vill{" "}
              <strong>följa besparingen över tid</strong> och{" "}
              <strong>exportera ut underlaget</strong> — utan att tappa äldre
              analyser efter tre månader.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 text-sm space-y-4">
            <p className="font-medium text-gray-900">Vanliga frågor</p>
            <div>
              <p className="font-medium text-gray-800">Kan jag avsluta?</p>
              <p className="text-gray-600">
                Ja. Premium löper per år och du kan låta bli att förnya — inga
                bindningstider utöver den betalda perioden.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Vad händer med mina analyser?</p>
              <p className="text-gray-600">
                De sparas på ditt konto. Gratis ser du senaste 3 månaderna;
                Premium visar hela historiken och låter dig exportera till CSV.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Är 99 kr/år värt det?</p>
              <p className="text-gray-600">
                Om du byter avtal eller bara undviker en onödig avgift sparar de
                flesta mer än så på en månad. Premium hjälper dig se att
                besparingen faktiskt håller.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
