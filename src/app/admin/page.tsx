"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, UserPlus, Crown, Mail, Phone, Zap, ArrowRight, Activity, Star, X, BarChart3, Edit } from "lucide-react";
import Link from "next/link";
import { Lead, ElectricityProvider, ApiResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

interface MemberStats {
  total: number;
  today: number;
  premium: number;
  free: number;
  activePremium: number;
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "converted" | "rejected">("all");
  const [providers, setProviders] = useState<ElectricityProvider[]>([]);
  const [bestChoiceProviderIdVariable, setBestChoiceProviderIdVariable] = useState<string | null>(null);
  const [bestChoiceProviderIdFixed, setBestChoiceProviderIdFixed] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [memberStats, setMemberStats] = useState<MemberStats>({
    total: 0,
    today: 0,
    premium: 0,
    free: 0,
    activePremium: 0,
  });
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

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

    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/leads');
        if (response.ok) {
          const data = await response.json() as { success: boolean; data: Lead[]; count: number };
          setLeads(data.data || []);
        } else {
          console.error('Kunde inte hämta leads:', response.statusText);
        }
      } catch (error) {
        console.error('Fel vid hämtning av leads:', error);
      } finally {
        setIsLoading(false);
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

    fetchMembers();
    fetchLeads();
    fetchProviders();
    fetchSettings();
    fetchAnalytics();
  }, []);

  const filteredLeads = filter === "all" 
    ? leads 
    : leads.filter(lead => lead.status === filter);

  const legacyLeadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    converted: leads.filter(l => l.status === "converted").length,
    totalSavings: leads.reduce((sum, l) => sum + (l.savings?.potentialSavings || 0), 0)
  };

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

  const updateLeadStatus = async (id: string, status: "new" | "contacted" | "converted" | "rejected") => {
    try {
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status
        }),
      });

      const result = await response.json() as ApiResponse<Lead>;
      
      if (result.success && result.data) {
        setLeads(leads.map(lead => lead.id === id ? result.data! : lead));
        alert('✅ Status uppdaterad!');
      } else {
        alert('❌ Kunde inte uppdatera status: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const updateLead = async (id: string, data: { email?: string; phone?: string }) => {
    try {
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...data
        }),
      });

      const result = await response.json() as ApiResponse<Lead>;
      
      if (result.success && result.data) {
        setLeads(leads.map(lead => lead.id === id ? result.data! : lead));
        setEditingLead(null);
        alert('✅ Lead uppdaterad!');
      } else {
        alert('❌ Kunde inte uppdatera lead: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
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
                      {analyticsData.analytics.totalVisits > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {((analyticsData.analytics.contractClicks || 0) / analyticsData.analytics.totalVisits * 100).toFixed(2)}% konvertering
                        </p>
                      )}
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

          {/* Member stats (current product) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Gamla kontaktleads</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{legacyLeadStats.total}</p>
              <p className="text-xs text-gray-500 mt-1">från tidigare bytessystem</p>
            </div>
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

          {/* Legacy contact leads from old switch-on-site flow */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kontaktleads (äldre bytessystem)</h2>
            <p className="text-sm text-gray-500 mt-1">
              Kvarleva från när kunder bytte avtal direkt via kontaktformulär. Aktuella medlemmar finns under EBL Premium / användare.
            </p>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              {(["all", "new", "contacted", "converted", "rejected"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all
                    ${filter === f 
                      ? "bg-blue-600 text-white" 
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  {f === "all" ? "Alla" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Leads List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {isLoading ? (
              <div className="p-8 sm:p-12 text-center">
                <p className="text-gray-500">Laddar leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Inga gamla kontaktleads</p>
                <p className="text-sm text-gray-400 mt-2">
                  Nya medlemmar syns under EBL Premium, inte här.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        {lead.email && (
                          <p className="font-medium flex items-center gap-2 text-gray-900 break-words">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="break-all">{lead.email}</span>
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="break-all">{lead.phone}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                          title="Redigera lead"
                          aria-label="Redigera lead"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <span className={`
                          px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
                          ${lead.status === "new" && "bg-yellow-100 text-yellow-800"}
                          ${lead.status === "contacted" && "bg-blue-100 text-blue-800"}
                          ${lead.status === "converted" && "bg-green-100 text-green-800"}
                          ${lead.status === "rejected" && "bg-red-100 text-red-800"}
                        `}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Besparing</p>
                        <p className="font-semibold text-purple-600">
                          {formatCurrency(lead.savings.potentialSavings)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Förbrukning</p>
                        <p className="font-medium text-gray-900">{lead.billData.totalKWh} kWh</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Skapad</p>
                        <p className="font-medium text-gray-900">
                          {new Date(lead.createdAt).toLocaleDateString("sv-SE")}
                        </p>
                      </div>
                    </div>
                    
                    {/* Status Update Buttons */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {lead.status !== "new" && (
                        <button
                          onClick={() => updateLeadStatus(lead.id, "new")}
                          className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 active:bg-yellow-200 transition-colors touch-manipulation"
                        >
                          <span className="hidden sm:inline">Markera som </span>ny
                        </button>
                      )}
                      {lead.status !== "contacted" && (
                        <button
                          onClick={() => updateLeadStatus(lead.id, "contacted")}
                          className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation"
                        >
                          <span className="hidden sm:inline">Markera som </span>kontaktad
                        </button>
                      )}
                      {lead.status !== "converted" && (
                        <button
                          onClick={() => updateLeadStatus(lead.id, "converted")}
                          className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors touch-manipulation"
                        >
                          <span className="hidden sm:inline">Markera som </span>konverterad
                        </button>
                      )}
                      {lead.status !== "rejected" && (
                        <button
                          onClick={() => updateLeadStatus(lead.id, "rejected")}
                          className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors touch-manipulation"
                        >
                          <span className="hidden sm:inline">Markera som </span>avvisad
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 text-center">
              💡 <strong>Tips:</strong> Leads sparas i databasen och Telegram-notiser skickas vid nya kontaktförfrågningar.
            </p>
          </div>

          {/* Edit Lead Modal */}
          {editingLead && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Redigera lead</h2>
                    <button
                      onClick={() => setEditingLead(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 touch-manipulation"
                      aria-label="Stäng"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      updateLead(editingLead.id, {
                        email: formData.get('email') as string || undefined,
                        phone: formData.get('phone') as string || undefined,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                        E-post
                      </label>
                      <input
                        type="email"
                        id="edit-email"
                        name="email"
                        defaultValue={editingLead.email || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="exempel@email.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        id="edit-phone"
                        name="phone"
                        defaultValue={editingLead.phone || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="070-123 45 67"
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingLead(null)}
                          className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation font-medium"
                        >
                          Avbryt
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation font-medium"
                        >
                          Spara
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

