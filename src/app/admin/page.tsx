"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, AlertCircle, CheckCircle2, Mail, Phone, Zap, ArrowRight, Activity, Star, X, BarChart3, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Lead, ElectricityProvider, ApiResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

interface AnalyticsData {
  enabled: boolean;
  analytics?: {
    totalVisits: number;
    uniqueVisitors: number;
    pageViews: number;
    topPages: Array<{ path: string; views: number }>;
    visitsByDay: Array<{ date: string; visits: number }>;
    referrers: Array<{ source: string; visits: number }>;
    devices: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
    lastUpdated: string;
  };
  links?: {
    googleAnalytics: string | null;
    hotjar: string | null;
  };
  message?: string;
  note?: string;
}

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "converted" | "rejected">("all");
  const [providers, setProviders] = useState<ElectricityProvider[]>([]);
  const [bestChoiceProviderId, setBestChoiceProviderId] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  useEffect(() => {
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
        const response = await fetch('/api/providers?includeHidden=true');
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
          const data = await response.json() as ApiResponse<{ bestChoiceProviderId: string | null }>;
          if (data.success && data.data) {
            setBestChoiceProviderId(data.data.bestChoiceProviderId);
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

    fetchLeads();
    fetchProviders();
    fetchSettings();
    fetchAnalytics();
  }, []);

  const filteredLeads = filter === "all" 
    ? leads 
    : leads.filter(lead => lead.status === filter);

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    converted: leads.filter(l => l.status === "converted").length,
    totalSavings: leads.reduce((sum, l) => sum + l.savings.potentialSavings, 0)
  };

  const handleBestChoiceChange = async (providerId: string | null) => {
    try {
      setIsSavingSettings(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bestChoiceProviderId: providerId }),
      });

      if (response.ok) {
        const data = await response.json() as ApiResponse<{ bestChoiceProviderId: string | null }>;
        if (data.success && data.data) {
          setBestChoiceProviderId(data.data.bestChoiceProviderId);
          alert('✅ Bästa val uppdaterat!');
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

  const selectedProvider = providers.find(p => p.id === bestChoiceProviderId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600">Översikt över leads och besparingar</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link
                  href="/admin/providers"
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Hantera leverantörer</span>
                  <span className="sm:hidden">Leverantörer</span>
                </Link>
                <Link
                  href="/admin/switch-requests"
                  className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span className="hidden sm:inline">Bytförfrågningar</span>
                  <span className="sm:hidden">Bytförfrågningar</span>
                </Link>
                <Link
                  href="/admin/price-updates"
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Prisuppdateringar</span>
                  <span className="sm:hidden">Priser</span>
                </Link>
                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Stats</span>
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
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                Visa mer
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            
            {isLoadingAnalytics ? (
              <p className="text-gray-500">Laddar analytics...</p>
            ) : analyticsData && analyticsData.enabled ? (
              <div>
                {analyticsData.analytics ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Senast uppdaterad</p>
                      <p className="text-sm font-medium text-gray-600">
                        {new Date(analyticsData.analytics.lastUpdated).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Analytics är aktiverat. För att se detaljerad statistik, använd länkarna nedan eller integrera Google Analytics API.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analyticsData.links?.googleAnalytics && (
                        <a
                          href={analyticsData.links.googleAnalytics}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Google Analytics
                        </a>
                      )}
                      {analyticsData.links?.hotjar && (
                        <a
                          href={analyticsData.links.hotjar}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Hotjar Dashboard
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  {analyticsData?.message || "Analytics är inte aktiverat. Aktivera det i .env för att se besöksstatistik."}
                </p>
                {analyticsData?.links && (analyticsData.links.googleAnalytics || analyticsData.links.hotjar) && (
                  <div className="flex flex-wrap gap-2">
                    {analyticsData.links.googleAnalytics && (
                      <a
                        href={analyticsData.links.googleAnalytics}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Google Analytics
                      </a>
                    )}
                    {analyticsData.links.hotjar && (
                      <a
                        href={analyticsData.links.hotjar}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Hotjar Dashboard
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Totalt leads</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Nya</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.new}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Konverterade</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.converted}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Total besparing</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(stats.totalSavings)}</p>
            </div>
          </div>

          {/* Best Choice Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Bästa val</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Välj vilken leverantör som ska visas som "Bästa val" i jämförelsen. Om inget val görs används automatisk sortering.
            </p>
            
            {isLoadingSettings ? (
              <p className="text-gray-500">Laddar inställningar...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={bestChoiceProviderId || ""}
                    onChange={(e) => handleBestChoiceChange(e.target.value || null)}
                    disabled={isSavingSettings}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Ingen (använd automatisk sortering)</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  {bestChoiceProviderId && (
                    <button
                      onClick={() => handleBestChoiceChange(null)}
                      disabled={isSavingSettings}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Rensa val
                    </button>
                  )}
                </div>
                
                {selectedProvider && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Vald leverantör:</p>
                    <p className="text-lg font-bold text-blue-700">{selectedProvider.name}</p>
                    <p className="text-sm text-blue-600 mt-1">{selectedProvider.description}</p>
                  </div>
                )}
              </div>
            )}
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
                <p className="text-gray-500 text-lg font-medium">Inga leads ännu</p>
                <p className="text-sm text-gray-400 mt-2">
                  När användare fyller i kontaktformuläret dyker de upp här.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                      <div className="flex-1">
                        {lead.email && (
                          <p className="font-medium flex items-center gap-2 text-gray-900">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {lead.email}
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4" />
                            {lead.phone}
                          </p>
                        )}
                      </div>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium self-start
                        ${lead.status === "new" && "bg-yellow-100 text-yellow-800"}
                        ${lead.status === "contacted" && "bg-blue-100 text-blue-800"}
                        ${lead.status === "converted" && "bg-green-100 text-green-800"}
                        ${lead.status === "rejected" && "bg-red-100 text-red-800"}
                      `}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
        </div>
      </div>
    </div>
  );
}

