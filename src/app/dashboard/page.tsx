"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Calendar, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target,
  Users,
  Download,
  Upload,
  Sparkles,
  Crown,
  User,
  LogOut,
  Trash2,
  Lock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BillAnalysis } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { AnalyticsEvents } from "@/lib/analytics";
import { startPremiumCheckout } from "@/lib/start-premium-checkout";
import { PREMIUM_PRICE_CTA, PREMIUM_PRICE_LABEL } from "@/lib/premium-pricing";

interface DashboardStats {
  totalAnalyses: number;
  totalSavings: number;
  averageSavings: number;
  currentMonthlyCost: number;
  lastAnalysisDate: string | null;
  trend: 'up' | 'down' | 'stable';
  benchmarkComparison: {
    percentile: number; // 0-100, var du ligger jämfört med andra
    averageInArea: number;
    yourCost: number;
  };
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<BillAnalysis[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [timeRange, setTimeRange] = useState<"month" | "3months" | "year" | "all">("3months");
  const [historyLimited, setHistoryLimited] = useState(false);
  const [hiddenAnalysesCount, setHiddenAnalysesCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showPremiumNudge, setShowPremiumNudge] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [autoCheckout, setAutoCheckout] = useState(false);
  const autoCheckoutStarted = useRef(false);

  const goPremiumCheckout = async (source: string) => {
    if (!user?.email) {
      router.push("/premium");
      return;
    }
    setStartingCheckout(true);
    const ok = await startPremiumCheckout(
      { user: { email: user.email, id: user.id } },
      source
    );
    if (!ok) {
      setStartingCheckout(false);
      router.push("/premium");
    }
  };

  // Deep link from email/CTA: /dashboard?checkout=1 opens Stripe (same as /premium?checkout=1).
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
    void goPremiumCheckout("dashboard_auto_checkout");
  }, [autoCheckout, loading, isLoading, user, isPremium, startingCheckout]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (deletingId === id) return; // Förhindra dubbelklick
    
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

      // Ta bort från listan
      setAnalyses(prev => prev.filter(a => a.id !== id));
      
      // Uppdatera statistik
      await fetchDashboardData();
      
      console.log(`[Dashboard] ✅ Faktura ${id} borttagen`);
    } catch (error) {
      console.error('[Dashboard] ❌ Fel vid borttagning av faktura:', error);
      alert(error instanceof Error ? error.message : 'Kunde inte ta bort faktura');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Create session-like object from user for fetchWithAuth
      const session = user ? {
        user: {
          email: user.email || undefined,
          id: user.id
        }
      } : null;
      
      // Log session for debugging
      console.log("[Dashboard] fetchDashboardData called with session:", {
        hasSession: !!session,
        hasUser: !!user,
        email: user?.email,
        id: user?.id
      });
      
      // Hämta användarinfo (inkl. premium-status)
      const userInfoResponse = await fetchWithAuth('/api/user/info', {}, session);
      let premium = false;
      if (userInfoResponse.ok) {
        const userInfoData = await userInfoResponse.json();
        if (userInfoData.success) {
          premium = Boolean(userInfoData.data.isPremium);
          setIsPremium(premium);
        }
      }
      
      // Hämta fakturaanalyser från API (server clamps free users to 3 months)
      const analysesResponse = await fetchWithAuth(`/api/user/bill-analyses?range=${timeRange}`, {}, session);
      if (!analysesResponse.ok) {
        if (analysesResponse.status === 401) {
          // Not authenticated - session check should handle this, but log for debugging
          console.warn("[Dashboard] 401 Unauthorized - session may have expired");
          router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/dashboard")}`);
          return;
        }
        throw new Error('Kunde inte hämta analyser');
      }
      
      const analysesData = await analysesResponse.json();
      const analyses = analysesData.success ? analysesData.data : [];
      if (analysesData.meta?.historyLimited) {
        setHistoryLimited(true);
        if (analysesData.meta.range && analysesData.meta.range !== timeRange) {
          setTimeRange(analysesData.meta.range);
        }
      } else {
        setHistoryLimited(false);
      }
      setHiddenAnalysesCount(Number(analysesData.meta?.hiddenAnalysesCount) || 0);
      if (!premium && (timeRange === "year" || timeRange === "all")) {
        setTimeRange("3months");
      }
      
      console.log(`[Dashboard] Fetched ${analyses.length} analyses from API`);
      if (analyses.length > 0) {
        console.log(`[Dashboard] First analysis:`, {
          id: analyses[0].id,
          createdAt: analyses[0].createdAt,
          totalAmount: analyses[0].billData.totalAmount,
          userId: analyses[0].userId || 'no userId'
        });
      }
      
      // Hämta statistik
      const statsResponse = await fetchWithAuth('/api/user/stats', {}, session);
      if (!statsResponse.ok) {
        throw new Error('Kunde inte hämta statistik');
      }
      
      const statsData = await statsResponse.json();
      const stats = statsData.success ? statsData.data : null;
      
      // Använd riktig data - inga mockdata
      console.log(`[Dashboard] Setting analyses: ${analyses.length} real analyses`);
      if (analyses.length === 0) {
        console.log(`[Dashboard] No analyses found for user. User should upload a bill to see data.`);
      }
      setAnalyses(analyses);
      
      // Använd riktig statistik om den finns, annars visa tom statistik
      if (stats) {
        setStats(stats);
      } else if (analyses.length > 0) {
        // Om vi har analyser men ingen statistik, beräkna från analyserna
        const totalSavings = analyses.reduce((sum: number, a: BillAnalysis) => sum + a.savings.potentialSavings, 0);
        const avgSavings = analyses.length > 0 ? totalSavings / analyses.length : 0;
        const latestCost = analyses[0]?.billData.totalAmount || 0;
        
        setStats({
          totalAnalyses: analyses.length,
          totalSavings,
          averageSavings: avgSavings,
          currentMonthlyCost: latestCost,
          lastAnalysisDate: analyses[0]?.createdAt.toISOString() || null,
          trend: 'stable',
          benchmarkComparison: {
            percentile: 50,
            averageInArea: latestCost,
            yourCost: latestCost
          }
        });
      } else {
        // Ingen data alls - visa tom statistik
        setStats({
          totalAnalyses: 0,
          totalSavings: 0,
          averageSavings: 0,
          currentMonthlyCost: 0,
          lastAnalysisDate: null,
          trend: 'stable',
          benchmarkComparison: {
            percentile: 50,
            averageInArea: 0,
            yourCost: 0
          }
        });
      }
    } catch (error) {
      console.error('Fel vid hämtning av dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, router, user]);

  // Wait for session to be loaded before fetching data
  useEffect(() => {
    console.log("[Dashboard] Auth status:", loading ? "loading" : user ? "authenticated" : "unauthenticated");
    console.log("[Dashboard] User:", user);
    
    if (loading) {
      // Still loading session, wait
      console.log("[Dashboard] Waiting for auth to load...");
      return;
    }
    
    if (!user) {
      // Not authenticated, redirect to signin
      console.log("[Dashboard] Not authenticated, redirecting to signin");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/dashboard")}`);
      return;
    }
    
    if (user) {
      // Verify user has required data
      if (!user.email) {
        console.error("[Dashboard] User authenticated but missing email! User:", user);
        // Redirect to signin if email is missing
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/dashboard")}`);
        return;
      }
      
      // User is ready, fetch data
      console.log("[Dashboard] User authenticated, fetching data...");
      console.log("[Dashboard] User email:", user.email);
      fetchDashboardData();
    }
  }, [loading, user, fetchDashboardData, router]);

  // Refresh data when page becomes visible (e.g., when returning from result page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log("[Dashboard] Page became visible, refreshing data...");
        fetchDashboardData();
      }
    };

    const handleFocus = () => {
      if (user) {
        console.log("[Dashboard] Window focused, refreshing data...");
        fetchDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchDashboardData]);

  useEffect(() => {
    if (isLoading || isPremium) return;
    if (analyses.length < 2 && hiddenAnalysesCount < 1) return;
    try {
      const key = "elbespararen_premium_nudge_dismissed";
      const raw = localStorage.getItem(key);
      if (raw) {
        const dismissedAt = Number(raw);
        // FOMO users (hidden analyses): re-show after 1 day; others after 3 days
        const coolDownMs =
          hiddenAnalysesCount > 0
            ? 1 * 24 * 60 * 60 * 1000
            : 3 * 24 * 60 * 60 * 1000;
        if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt < coolDownMs) {
          return;
        }
      }
      setShowPremiumNudge(true);
    } catch {
      setShowPremiumNudge(true);
    }
  }, [isLoading, isPremium, analyses.length, hiddenAnalysesCount]);

  const dismissPremiumNudge = () => {
    setShowPremiumNudge(false);
    try {
      localStorage.setItem("elbespararen_premium_nudge_dismissed", String(Date.now()));
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    );
  }

  const showStickyPaywall =
    !isPremium &&
    !showPremiumNudge &&
    (hiddenAnalysesCount > 0 || analyses.length >= 2);

  return (
    <div className={`min-h-screen bg-gray-50 ${showStickyPaywall ? "pb-24" : ""}`}>
      {showPremiumNudge && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-labelledby="premium-nudge-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-amber-100"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-lg bg-amber-100 p-2">
                <Sparkles className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h2 id="premium-nudge-title" className="text-lg font-semibold text-gray-900">
                  {hiddenAnalysesCount > 0
                    ? `${hiddenAnalysesCount} analys${hiddenAnalysesCount === 1 ? "" : "er"} väntar bakom Premium`
                    : analyses.length >= 2
                      ? `Gratisplanen: max 2 sparade fakturor`
                      : `Du har ${analyses.length} sparade analyser`}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {hiddenAnalysesCount > 0
                    ? `Gratis visar max 2 sparade. Premium (${PREMIUM_PRICE_LABEL}, ca 4 kr/mån) låser upp hela historiken och CSV — öppnar säker Stripe-betalning direkt.`
                    : analyses.length >= 2
                      ? `Nästa faktura sparas inte på kontot utan Premium. Obegränsat sparande, historik och CSV — ${PREMIUM_PRICE_LABEL}.`
                      : `Gratis visar 3 månader. Premium (${PREMIUM_PRICE_LABEL}) ger obegränsad historik och CSV — så du ser att besparingen håller.`}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={startingCheckout}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                onClick={async () => {
                  await goPremiumCheckout("dashboard_nudge");
                }}
              >
                {startingCheckout ? "Öppnar betalning…" : PREMIUM_PRICE_CTA}
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={dismissPremiumNudge}
                className="rounded-lg px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50"
              >
                Inte nu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Mitt Dashboard</h1>
                {isPremium && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full text-sm font-semibold">
                    <Crown className="w-4 h-4" />
                    <span>Premium</span>
                  </div>
                )}
              </div>
              {/* User welcome section */}
              {user && (
                <div className="flex items-center gap-3 mb-1">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || user.email || "User"}
                      className="w-8 h-8 rounded-full border-2 border-primary"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-primary">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Välkommen, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Användare'}!
                    </p>
                    {user.email && user.user_metadata?.full_name && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                </div>
              )}
              <p className="text-gray-600 mt-1">Översikt över dina fakturaanalyser och besparingar</p>
              {!isPremium && analyses.length === 1 && (
                <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Du har 1 av 2 gratis sparplatser kvar.{" "}
                  <Link href="/upload" className="font-semibold underline hover:no-underline">
                    Ladda upp nästa månadsfaktura
                  </Link>{" "}
                  och jämför — eller{" "}
                  <Link
                    href="/premium"
                    className="font-semibold underline hover:no-underline"
                    onClick={() => AnalyticsEvents.premiumCtaClicked("dashboard_one_slot")}
                  >
                    bli Premium
                  </Link>{" "}
                  för obegränsat.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => {
                  const next = e.target.value as typeof timeRange;
                  if (!isPremium && (next === "year" || next === "all")) {
                    setHistoryLimited(true);
                    return;
                  }
                  setTimeRange(next);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="month">Senaste månaden</option>
                <option value="3months">Senaste 3 månaderna</option>
                <option value="year" disabled={!isPremium}>
                  Senaste året {!isPremium && "(Premium)"}
                </option>
                <option value="all" disabled={!isPremium}>
                  All tid {!isPremium && "(Premium)"}
                </option>
              </select>
              <Link
                href="/upload"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Analysera ny faktura
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                title="Logga ut"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logga ut</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sparat */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Totalt sparat</h3>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalSavings || 0)}</p>
            <p className="text-sm text-gray-600 mt-2">{stats?.totalAnalyses || 0} fakturor analyserade</p>
          </div>

          {/* Nuvarande månadskostnad */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Nuvarande kostnad</h3>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.currentMonthlyCost || 0)}</p>
            <p className="text-sm text-gray-600 mt-2">per månad</p>
          </div>

          {/* Genomsnittlig besparing */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Genomsnittlig besparing</h3>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.averageSavings || 0)}</p>
            <p className="text-sm text-gray-600 mt-2">per faktura</p>
          </div>

          {/* Benchmark */}
          <div className={`rounded-xl p-6 border shadow-sm relative ${isPremium ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' : 'bg-white border-gray-200'}`}>
            {isPremium && (
              <div className="absolute top-3 right-3">
                <Sparkles className="w-4 h-4 text-orange-500" />
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${isPremium ? 'bg-orange-500' : 'bg-orange-500'}`}>
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Jämfört med andra
              {isPremium && <span className="ml-2 text-xs text-orange-600 font-medium">(Premium)</span>}
            </h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.benchmarkComparison.percentile || 0}%</p>
            <p className="text-sm text-gray-600 mt-2">
              {stats && stats.benchmarkComparison.percentile > 50 
                ? "Du betalar mer än genomsnittet" 
                : "Du betalar mindre än genomsnittet"}
            </p>
          </div>
        </div>

        {!isPremium && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>
              {hiddenAnalysesCount > 0
                ? `Du har ${hiddenAnalysesCount} analys${hiddenAnalysesCount === 1 ? "" : "er"} dolda. Gratis visar max 2 sparade (3 mån) — Premium låser upp allt + CSV-export.`
                : historyLimited
                  ? "Den perioden kräver Premium. Gratis visar senaste 3 månaderna."
                  : analyses.length >= 2
                    ? `Gratisplanen är full (2/2). Nästa faktura sparas inte utan Premium — ${PREMIUM_PRICE_LABEL}.`
                    : analyses.length === 1
                      ? `Du har 1 av 2 gratisplatser kvar. Nästa sparade faktura fyller gratisplanen — Premium (${PREMIUM_PRICE_LABEL}) tar bort taket.`
                      : `Gratis: max 2 sparade + 3 månader. Premium ger obegränsat + CSV — ${PREMIUM_PRICE_LABEL}.`}
            </span>
            <button
              type="button"
              disabled={startingCheckout}
              onClick={() => goPremiumCheckout("dashboard_banner")}
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {startingCheckout
                ? "Öppnar…"
                : hiddenAnalysesCount > 0
                  ? `Lås upp ${hiddenAnalysesCount} — ${PREMIUM_PRICE_LABEL}`
                  : `Bli Premium — ${PREMIUM_PRICE_LABEL}`}
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Trend Chart - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Kostnadstrend</h2>
                <p className="text-sm text-gray-600">Utveckling över tid</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Simple Chart Mockup */}
            <div className="h-64 flex items-end justify-between gap-2">
              {analyses.map((analysis, index) => {
                const height = (analysis.billData.totalAmount / 1200) * 100; // Normalize to max 1200
                return (
                  <div key={analysis.id} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${formatCurrency(analysis.billData.totalAmount)} - ${analysis.billData.period}`}
                    />
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      {new Date(analysis.createdAt).toLocaleDateString('sv-SE', { month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Din kostnad</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Genomsnitt i område</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recommendations */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Nästa steg</h2>
            
            <div className="space-y-4">
              {/* Recommendation Card */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Tid att byta avtal?</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Du betalar {formatCurrency(stats?.benchmarkComparison.yourCost || 0)}/månad. 
                      Genomsnittet i ditt område är {formatCurrency(stats?.benchmarkComparison.averageInArea || 0)}.
                    </p>
                    <Link
                      href="/contracts"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Se bättre avtal
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Upload Reminder */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Ladda upp ny faktura</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Din senaste analys är från {stats?.lastAnalysisDate 
                        ? new Date(stats.lastAnalysisDate).toLocaleDateString('sv-SE')
                        : 'aldrig'}.
                    </p>
                    <Link
                      href="/upload"
                      className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      Analysera nu
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Export Option */}
              <div className={`p-4 rounded-lg border ${isPremium ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <Download className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isPremium ? 'text-green-600' : 'text-gray-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">Exportera data</h3>
                      {isPremium && (
                        <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full font-medium">Premium</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {isPremium
                        ? "Ladda ner dina analyser som CSV."
                        : "Exportera dina analyser som CSV. Premium-funktion."}
                    </p>
                    {isPremium ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const session = user
                                ? {
                                    user: {
                                      email: user.email || undefined,
                                      id: user.id,
                                    },
                                  }
                                : null;
                              const res = await fetchWithAuth(
                                `/api/user/export?format=csv&range=${timeRange}`,
                                {},
                                session
                              );
                              if (!res.ok) {
                                const err = await res.json().catch(() => ({}));
                                alert(err.error || "Kunde inte exportera");
                                return;
                              }
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `elbespararen-analyser-${new Date().toISOString().slice(0, 10)}.csv`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } catch (e) {
                              console.error(e);
                              alert("Kunde inte exportera. Försök igen.");
                            }
                          }}
                          className="text-sm font-medium text-green-700 hover:text-green-800 flex items-center gap-1 px-3 py-1.5 bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                        >
                          CSV
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={startingCheckout}
                        onClick={() => goPremiumCheckout("dashboard_export")}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-60"
                      >
                        {startingCheckout ? "Öppnar betalning…" : "Uppgradera till Premium"}
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Senaste analyser</h2>
              <p className="text-sm text-gray-600">Dina fakturaanalyser över tid</p>
            </div>
            <Link
              href="/dashboard/analyses"
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
            >
              Visa alla
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {analyses.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Inga analyser ännu</p>
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Analysera din första faktura
                </Link>
              </div>
            ) : (
              <>
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          analysis.validationStatus === 'correct' 
                            ? 'bg-green-100' 
                            : 'bg-yellow-100'
                        }`}>
                          {analysis.validationStatus === 'correct' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {analysis.billData.period}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {analysis.billData.totalKWh} kWh • {formatCurrency(analysis.billData.totalAmount)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">
                            Potentiell besparing: <span className="font-semibold text-green-600">
                              {formatCurrency(analysis.savings.potentialSavings)}
                            </span>
                          </span>
                        </div>
                        <div className="text-gray-500">
                          {analysis.billData.extraFeesDetailed.length} extra avgifter identifierade
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-sm text-gray-500">
                        {new Date(analysis.createdAt).toLocaleDateString('sv-SE')}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        analysis.aiConfidence && analysis.aiConfidence >= 0.9
                          ? 'bg-green-100 text-green-700'
                          : analysis.aiConfidence && analysis.aiConfidence >= 0.7
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {analysis.aiConfidence ? `${Math.round(analysis.aiConfidence * 100)}% säker` : 'Okänt'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(analysis.id);
                        }}
                        disabled={deletingId === analysis.id}
                        className="mt-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Ta bort faktura"
                      >
                        {deletingId === analysis.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!isPremium && hiddenAnalysesCount > 0 && (
                <button
                  type="button"
                  disabled={startingCheckout}
                  onClick={() => goPremiumCheckout("dashboard_locked_cards")}
                  className="w-full text-left p-4 border border-dashed border-amber-300 bg-amber-50/60 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <Lock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-amber-950">
                        +{hiddenAnalysesCount} låst
                        {hiddenAnalysesCount === 1 ? " analys" : "a analyser"}
                      </h3>
                      <p className="text-sm text-amber-900/80">
                        Gratis visar max 2. Premium låser upp hela historiken —{" "}
                        {PREMIUM_PRICE_LABEL}.
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-amber-800 shrink-0">
                      {startingCheckout ? "Öppnar…" : "Lås upp"}
                    </span>
                  </div>
                </button>
              )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky paywall bar — stays after modal dismiss so return visits still convert */}
      {showStickyPaywall && (
          <div className="fixed bottom-0 inset-x-0 z-40 border-t border-amber-200 bg-amber-50/95 backdrop-blur px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-amber-950">
                {hiddenAnalysesCount > 0
                  ? `${hiddenAnalysesCount} analys${hiddenAnalysesCount === 1 ? "" : "er"} dolda — Premium (${PREMIUM_PRICE_LABEL}) låser upp allt + CSV.`
                  : `Gratisplanen full (2/2). Nästa faktura sparas inte utan Premium — ${PREMIUM_PRICE_LABEL}.`}
              </p>
              <button
                type="button"
                disabled={startingCheckout}
                onClick={() => goPremiumCheckout("dashboard_sticky_bar")}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {startingCheckout
                  ? "Öppnar…"
                  : hiddenAnalysesCount > 0
                    ? `Lås upp ${hiddenAnalysesCount} — ${PREMIUM_PRICE_LABEL}`
                    : PREMIUM_PRICE_CTA}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
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
    </div>
  );
}
