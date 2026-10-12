"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Trash2,
  ArrowLeft,
  Upload,
  Calendar,
  Filter,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import { BillAnalysis } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { startPremiumCheckout } from "@/lib/start-premium-checkout";
import { PREMIUM_PRICE_LABEL } from "@/lib/premium-pricing";
import AppHeader from "@/components/AppHeader";

export default function AnalysesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<BillAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"month" | "3months" | "year" | "all">("3months");
  const [isPremium, setIsPremium] = useState(false);
  const [hiddenAnalysesCount, setHiddenAnalysesCount] = useState(0);
  const [totalSavedCount, setTotalSavedCount] = useState(0);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [autoCheckout, setAutoCheckout] = useState(false);
  const autoCheckoutStarted = useRef(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const goPremiumCheckout = async (source: string) => {
    if (!user?.email || startingCheckout) return;
    setStartingCheckout(true);
    const ok = await startPremiumCheckout(
      { user: { email: user.email, id: user.id } },
      source
    );
    if (!ok) {
      setStartingCheckout(false);
      router.push("/premium?checkout=1");
    }
  };

  const fetchAnalyses = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const session = {
        user: {
          email: user.email || undefined,
          id: user.id
        }
      };
      
      const infoRes = await fetchWithAuth("/api/user/info", {}, session);
      if (infoRes.ok) {
        const info = await infoRes.json();
        if (info.success) {
          setIsPremium(Boolean(info.data?.isPremium));
        }
      }

      const analysesResponse = await fetchWithAuth(`/api/user/bill-analyses?range=${timeRange}`, {}, session);
      
      if (!analysesResponse.ok) {
        if (analysesResponse.status === 401) {
          router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/dashboard/analyses")}`);
          return;
        }
        throw new Error('Kunde inte hämta analyser');
      }
      
      const analysesData = await analysesResponse.json();
      const fetchedAnalyses = analysesData.success ? analysesData.data : [];
      setAnalyses(fetchedAnalyses);
      setHiddenAnalysesCount(Number(analysesData.meta?.hiddenAnalysesCount) || 0);
      setTotalSavedCount(
        Number(analysesData.meta?.totalSavedCount) || fetchedAnalyses.length
      );
      if (analysesData.meta?.historyLimited && analysesData.meta.range) {
        setTimeRange(analysesData.meta.range);
      }
    } catch (error) {
      console.error('Fel vid hämtning av analyser:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, router, user]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("checkout") === "1") {
      setAutoCheckout(true);
    }
  }, []);

  useEffect(() => {
    if (
      !autoCheckout ||
      loading ||
      isLoading ||
      !user?.email ||
      isPremium ||
      startingCheckout ||
      autoCheckoutStarted.current
    ) {
      return;
    }
    autoCheckoutStarted.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete("checkout");
    window.history.replaceState({}, "", url.pathname + url.search);
    void goPremiumCheckout("analyses_auto_checkout");
  }, [autoCheckout, loading, isLoading, user, isPremium, startingCheckout]);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/dashboard/analyses")}`);
    } else if (user) {
      fetchAnalyses();
    }
  }, [user, loading, fetchAnalyses, router]);

  const handleDeleteAnalysis = async (id: string) => {
    if (deletingId === id) return;
    
    setDeletingId(id);
    try {
      const session = user ? {
        user: {
          email: user.email || undefined,
          id: user.id
        }
      } : null;

      const response = await fetchWithAuth(`/api/user/bill-analyses/${id}`, {
        method: 'DELETE',
      }, session);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunde inte ta bort faktura');
      }

      setAnalyses(prev => prev.filter(a => a.id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Fel vid borttagning av faktura:', error);
      alert(error instanceof Error ? error.message : 'Kunde inte ta bort faktura');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted">Laddar analyser...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till dashboard
          </Link>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Alla analyser</h1>
              <p className="text-muted">
                {!isPremium && hiddenAnalysesCount > 0
                  ? `${analyses.length} synliga · ${hiddenAnalysesCount} dolda bakom Premium`
                  : `${totalSavedCount || analyses.length} ${
                      (totalSavedCount || analyses.length) === 1 ? "analys" : "analyser"
                    } totalt`}
              </p>
            </div>
            {!isPremium && (hiddenAnalysesCount > 0 || totalSavedCount >= 2) && (
              <button
                type="button"
                disabled={startingCheckout}
                onClick={() => goPremiumCheckout("analyses_header")}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {startingCheckout
                  ? "Öppnar betalning…"
                  : hiddenAnalysesCount > 0
                    ? `Lås upp ${hiddenAnalysesCount} — ${PREMIUM_PRICE_LABEL}`
                    : `Bli Premium — ${PREMIUM_PRICE_LABEL}`}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {!isPremium && hiddenAnalysesCount > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2 text-sm text-amber-950">
              <Lock className="h-4 w-4 mt-0.5 shrink-0 text-amber-700" />
              <p>
                Gratis visar max 2 sparade (3 mån). Du har {hiddenAnalysesCount} analys
                {hiddenAnalysesCount === 1 ? "" : "er"} dolda — Premium låser upp hela
                historiken + CSV.
              </p>
            </div>
            <button
              type="button"
              disabled={startingCheckout}
              onClick={() => goPremiumCheckout("analyses_banner")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 shrink-0"
            >
              {startingCheckout ? "Öppnar…" : `Lås upp — ${PREMIUM_PRICE_LABEL}`}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg border border-border p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-muted" />
            <span className="text-sm font-medium text-foreground">Visa:</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "month" as const, label: "Senaste månaden", premium: false },
                { value: "3months" as const, label: "Senaste 3 månaderna", premium: false },
                { value: "year" as const, label: "Senaste året", premium: true },
                { value: "all" as const, label: "Alla", premium: true },
              ].map((option) => {
                const locked = option.premium && !isPremium;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={locked && startingCheckout}
                    onClick={() => {
                      if (locked) {
                        void goPremiumCheckout("analyses_range_locked");
                        return;
                      }
                      setTimeRange(option.value);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === option.value
                        ? "bg-primary text-white"
                        : locked
                          ? "bg-amber-50 text-amber-800 border border-dashed border-amber-300 hover:bg-amber-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    title={
                      locked
                        ? `Premium (${PREMIUM_PRICE_LABEL}) — öppnar betalning`
                        : undefined
                    }
                  >
                    {option.label}
                    {locked ? " · Lås upp" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Analyses List */}
        {analyses.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Inga analyser ännu
            </h2>
            <p className="text-muted mb-6">
              Ladda upp din första elräkning för att få en analys.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              <Upload className="w-5 h-5" />
              Analysera din första faktura
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        analysis.validationStatus === 'correct' 
                          ? 'bg-green-100' 
                          : 'bg-yellow-100'
                      }`}>
                        {analysis.validationStatus === 'correct' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {analysis.billData.period}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(analysis.createdAt).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span>{analysis.billData.totalKWh} kWh</span>
                          <span className="font-semibold">{formatCurrency(analysis.billData.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-12 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingDown className="w-4 h-4 text-green-600" />
                        <span className="text-muted">Potentiell besparing:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(analysis.savings.potentialSavings)}
                        </span>
                      </div>
                      
                      {analysis.billData.extraFeesDetailed.length > 0 && (
                        <div className="text-sm text-muted">
                          {analysis.billData.extraFeesDetailed.length} extra avgift{analysis.billData.extraFeesDetailed.length !== 1 ? 'er' : ''} identifierade
                        </div>
                      )}
                      
                      {analysis.aiConfidence && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          analysis.aiConfidence >= 0.9
                            ? 'bg-green-100 text-green-700'
                            : analysis.aiConfidence >= 0.7
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {Math.round(analysis.aiConfidence * 100)}% säkerhet
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setConfirmDeleteId(analysis.id)}
                    disabled={deletingId === analysis.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Ta bort faktura"
                  >
                    {deletingId === analysis.id ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bekräftelsedialog för borttagning */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ta bort faktura?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Är du säker på att du vill ta bort denna faktura? Denna åtgärd kan inte ångras.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deletingId === confirmDeleteId}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => confirmDeleteId && handleDeleteAnalysis(confirmDeleteId)}
                  disabled={deletingId === confirmDeleteId}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingId === confirmDeleteId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Tar bort...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Ta bort
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
