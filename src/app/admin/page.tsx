"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, AlertCircle, CheckCircle2, Mail, Phone, Zap, ArrowRight, Activity, Star, X, BarChart3, Edit } from "lucide-react";
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
  } | null;
  message?: string;
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
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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
          alert('✅ Mest populär uppdaterat!');
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
              <h2 className="text-xl font-bold text-gray-900">Mest populär</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Välj vilken leverantör som ska visas som "Mest populär" i jämförelsen. Om inget val görs används automatisk sortering.
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
    </div>
  );
}

