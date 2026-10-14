"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, UserPlus, Crown, Zap, ArrowRight, Star, BarChart3, X } from "lucide-react";
import Link from "next/link";
import { ElectricityProvider, ApiResponse } from "@/lib/types";

interface MemberStats {
  total: number;
  today: number;
  premium: number;
  free: number;
  activePremium: number;
}

interface SalesysChannelStat {
  readerId: string;
  name: string;
  brand: "Elchef" | "Elbespararen" | "Other";
  provider: string;
  value: number;
  position: number;
}

interface SalesysPeriodStats {
  period: "today" | "month";
  after: string;
  channels: SalesysChannelStat[];
  elbespararenTotal: number;
  elchefTotal: number;
  total: number;
}

interface SalesysData {
  dashboardUrl: string;
  today: SalesysPeriodStats;
  month: SalesysPeriodStats;
}

interface AnalyticsData {
  enabled: boolean;
  analytics?: {
    totalVisits: number;
    uniqueVisitors: number;
    pageViews: number;
    contractClicks: number;
    topPages: Array<{ path: string; views: number }>;
    visitsByDay: Array<{ date: string; visits: number }>;
    referrers: Array<{ source: string; visits: number }>;
    devices: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
    lastUpdated: string;
  } | null;
  message?: string;
}

export default function AdminPage() {
  const [providers, setProviders] = useState<ElectricityProvider[]>([]);
  const [bestChoiceProviderIdVariable, setBestChoiceProviderIdVariable] = useState<string | null>(null);
  const [bestChoiceProviderIdFixed, setBestChoiceProviderIdFixed] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [memberStats, setMemberStats] = useState<MemberStats>({
    total: 0,
    today: 0,
    premium: 0,
    free: 0,
    activePremium: 0,
  });
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [salesysData, setSalesysData] = useState<SalesysData | null>(null);
  const [isLoadingSalesys, setIsLoadingSalesys] = useState(true);
  const [salesysError, setSalesysError] = useState<string | null>(null);

  useEffect(() => {
    const isSameLocalDay = (iso: string | null) => {
      if (!iso) return false;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return false;
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };

    const fetchMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const response = await fetch('/api/admin/users');
        if (!response.ok) return;
        const payload = await response.json() as ApiResponse<{
          stats: { total: number; premium: number; free: number; activePremium: number };
          users: Array<{ createdAt: string | null }>;
        }>;
        if (!payload.success || !payload.data) return;
        const { stats, users } = payload.data;
        setMemberStats({
          total: stats.total,
          today: users.filter((u) => isSameLocalDay(u.createdAt)).length,
          premium: stats.premium,
          free: stats.free,
          activePremium: stats.activePremium,
        });
      } catch (error) {
        console.error('Fel vid hämtning av medlemmar:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    const fetchProviders = async () => {
      try {
        const response = await fetch(`/api/providers?includeHidden=true&t=${Date.now()}`, {
          cache: "no-store",
        });
        const result = await response.json() as ApiResponse<ElectricityProvider[]>;
        if (result.success && result.data) {
          setProviders(result.data.filter(p => p.isActive));
        }
      } catch (error) {
        console.error('Fel vid hämtning av leverantörer:', error);
      }
    };

    const fetchSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json() as ApiResponse<{ 
            bestChoiceProviderIdVariable: string | null;
            bestChoiceProviderIdFixed: string | null;
            bestChoiceProviderId?: string | null;
          }>;
          if (data.success && data.data) {
            // Använd nya värden om de finns, annars fallback till legacy
            setBestChoiceProviderIdVariable(data.data.bestChoiceProviderIdVariable ?? null);
            setBestChoiceProviderIdFixed(data.data.bestChoiceProviderIdFixed ?? null);
            // Backward compatibility: om inga separata värden finns, använd legacy
            if (!data.data.bestChoiceProviderIdVariable && !data.data.bestChoiceProviderIdFixed && data.data.bestChoiceProviderId) {
              // Om legacy finns men inga separata, behåll dem som null (användaren kan välja separat)
            }
          }
        }
      } catch (error) {
        console.error('Fel vid hämtning av inställningar:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        setIsLoadingAnalytics(true);
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json() as ApiResponse<AnalyticsData>;
          if (data.success && data.data) {
            setAnalyticsData(data.data);
          }
        }
      } catch (error) {
        console.error('Fel vid hämtning av analytics:', error);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    const fetchSalesys = async () => {
      try {
        setIsLoadingSalesys(true);
        setSalesysError(null);
        const response = await fetch('/api/admin/salesys');
        const payload = await response.json() as ApiResponse<SalesysData>;
        if (response.ok && payload.success && payload.data) {
          setSalesysData(payload.data);
        } else {
          setSalesysError(payload.error || 'Kunde inte hämta SaleSys');
        }
      } catch (error) {
        console.error('Fel vid hämtning av SaleSys:', error);
        setSalesysError('Kunde inte hämta SaleSys');
      } finally {
        setIsLoadingSalesys(false);
      }
    };

    fetchMembers();
    fetchProviders();
    fetchSettings();
    fetchAnalytics();
    fetchSalesys();
  }, []);

  const handleBestChoiceChange = async (type: 'variable' | 'fixed', providerId: string | null) => {
    try {
      setIsSavingSettings(true);
      const payload: { bestChoiceProviderIdVariable?: string | null; bestChoiceProviderIdFixed?: string | null } = {};
      
      if (type === 'variable') {
        payload.bestChoiceProviderIdVariable = providerId;
      } else {
        payload.bestChoiceProviderIdFixed = providerId;
      }
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json() as ApiResponse<{ 
          bestChoiceProviderIdVariable: string | null;
          bestChoiceProviderIdFixed: string | null;
        }>;
        if (data.success && data.data) {
          if (type === 'variable') {
            setBestChoiceProviderIdVariable(data.data.bestChoiceProviderIdVariable);
          } else {
            setBestChoiceProviderIdFixed(data.data.bestChoiceProviderIdFixed);
          }
          alert(`✅ Mest populär ${type === 'variable' ? 'rörligt' : 'fastpris'} uppdaterat!`);
        }
      } else {
        alert('❌ Kunde inte spara inställning');
      }
    } catch (error) {
      console.error('Fel vid sparande av inställning:', error);
      alert('❌ Nätverksfel vid sparande');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const selectedProviderVariable = providers.find(p => p.id === bestChoiceProviderIdVariable);
  const selectedProviderFixed = providers.find(p => p.id === bestChoiceProviderIdFixed);
  
  const variableProviders = providers.filter(p => p.contractType === 'rörligt');
  const fixedProviders = providers.filter(p => p.contractType === 'fastpris');

  return (
    <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
                <p className="mt-1 text-gray-600">Översikt över medlemmar och aktivitet</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/providers"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Zap className="h-4 w-4 text-gray-500" />
                  Leverantörer
                </Link>
                <Link
                  href="/admin/switch-requests"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                  Bytförfrågningar
                </Link>
                <Link
                  href="/admin/price-updates"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  Priser
                </Link>
                <Link
                  href="/admin/analytics"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                  Analytics
                </Link>
              </div>
            </div>
          </div>

          {/* Analytics Quick View */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Besöksstatistik</h2>
              </div>
              <Link
                href="/admin/analytics"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Visa mer →
              </Link>
            </div>
            
            {isLoadingAnalytics ? (
              <p className="text-gray-500">Laddar analytics...</p>
            ) : analyticsData && analyticsData.enabled ? (
              <div>
                {analyticsData.analytics ? (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Totalt besök</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.analytics.totalVisits.toLocaleString('sv-SE')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Unika besökare</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.analytics.uniqueVisitors.toLocaleString('sv-SE')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sidvisningar</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.analytics.pageViews.toLocaleString('sv-SE')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Kontraktsklick</p>
                      <p className="text-2xl font-bold text-gray-900">{(analyticsData.analytics.contractClicks || 0).toLocaleString('sv-SE')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        intresse (GA) — inte färdiga byten
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Senast uppdaterad</p>
                      <p className="text-sm font-medium text-gray-600">
                        {new Date(analyticsData.analytics.lastUpdated).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">
                      {analyticsData.message || "Konfigurera Google Analytics för att se data."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  {analyticsData?.message || "Analytics är inte aktiverat. Aktivera det i .env för att se besöksstatistik."}
                </p>
              </div>
            )}
          </div>

          {/* SaleSys: only Elbespararen channels in UI (Elchef kept in API for elchef.se/admin) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Försäljning (SaleSys)</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Färdiga Elbespararen-byten via affiliate — samma källa som statistik.salesys.se
                </p>
              </div>
              {salesysData?.dashboardUrl && (
                <a
                  href={salesysData.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Öppna SaleSys →
                </a>
              )}
            </div>

            {isLoadingSalesys ? (
              <p className="text-gray-500">Laddar SaleSys…</p>
            ) : salesysError ? (
              <p className="text-sm text-red-600">{salesysError}</p>
            ) : salesysData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                    <p className="text-xs text-emerald-800 uppercase tracking-wide mb-1">Denna månad</p>
                    <p className="text-3xl font-bold text-emerald-900">{salesysData.month.elbespararenTotal}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Idag</p>
                    <p className="text-3xl font-bold text-gray-900">{salesysData.today.elbespararenTotal}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 col-span-2 lg:col-span-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cheap Energy</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {salesysData.month.channels.find((c) => c.name === "Elbespararen - Cheap")?.value ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      idag:{" "}
                      {salesysData.today.channels.find((c) => c.name === "Elbespararen - Cheap")?.value ?? 0}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Per leverantör (denna månad)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {salesysData.month.channels
                      .filter((channel) => channel.brand === "Elbespararen")
                      .map((channel) => (
                        <div
                          key={channel.readerId}
                          className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3"
                        >
                          <p className="text-xs text-gray-500 truncate" title={channel.name}>
                            {channel.provider || channel.name}
                          </p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            {channel.value > 0 ? channel.value : "–"}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Member stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Link href="/admin/users" className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Nya medlemmar idag</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isLoadingMembers ? "…" : memberStats.today}
              </p>
            </Link>

            <Link href="/admin/users" className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Totalt medlemmar</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isLoadingMembers ? "…" : memberStats.total}
              </p>
            </Link>

            <Link href="/admin/users" className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Premium</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isLoadingMembers ? "…" : memberStats.activePremium}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isLoadingMembers ? "" : `${memberStats.free} free`}
              </p>
            </Link>
          </div>

          {/* Best Choice Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Mest populär</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Välj vilken leverantör som ska visas som "Mest populär" i jämförelsen för varje kategori. Om inget val görs används automatisk sortering.
            </p>
            
            {isLoadingSettings ? (
              <p className="text-gray-500">Laddar inställningar...</p>
            ) : (
              <div className="space-y-6">
                {/* Rörligt */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Rörligt</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={bestChoiceProviderIdVariable || ""}
                      onChange={(e) => handleBestChoiceChange('variable', e.target.value || null)}
                      disabled={isSavingSettings}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Ingen (använd automatisk sortering)</option>
                      {variableProviders.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                    {bestChoiceProviderIdVariable && (
                      <button
                        onClick={() => handleBestChoiceChange('variable', null)}
                        disabled={isSavingSettings}
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Rensa val
                      </button>
                    )}
                  </div>
                  
                  {selectedProviderVariable && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Vald leverantör (rörligt):</p>
                      <p className="text-lg font-bold text-blue-700">{selectedProviderVariable.name}</p>
                      <p className="text-sm text-blue-600 mt-1">{selectedProviderVariable.description}</p>
                    </div>
                  )}
                </div>

                {/* Fastpris */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Fastpris</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={bestChoiceProviderIdFixed || ""}
                      onChange={(e) => handleBestChoiceChange('fixed', e.target.value || null)}
                      disabled={isSavingSettings}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Ingen (använd automatisk sortering)</option>
                      {fixedProviders.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                    {bestChoiceProviderIdFixed && (
                      <button
                        onClick={() => handleBestChoiceChange('fixed', null)}
                        disabled={isSavingSettings}
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Rensa val
                      </button>
                    )}
                  </div>
                  
                  {selectedProviderFixed && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Vald leverantör (fastpris):</p>
                      <p className="text-lg font-bold text-blue-700">{selectedProviderFixed.name}</p>
                      <p className="text-sm text-blue-600 mt-1">{selectedProviderFixed.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
    </div>
  );
}

