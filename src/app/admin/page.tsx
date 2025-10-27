"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, AlertCircle, CheckCircle2, Mail, Phone, Zap, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";
import { Lead } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "converted" | "rejected">("all");

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/leads');
        if (response.ok) {
          const data = await response.json();
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

    fetchLeads();
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
              </div>
            </div>
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

