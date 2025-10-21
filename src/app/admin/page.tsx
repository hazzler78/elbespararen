"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, AlertCircle, CheckCircle2, Mail, Phone, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Lead } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

export default function AdminPage() {
  const [leads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "converted" | "rejected">("all");

  useEffect(() => {
    // TODO: Hämta leads från databas via API
    // För nu, visa mockdata
    setIsLoading(false);
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
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted">Översikt över leads och besparingar</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/providers"
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Hantera leverantörer
              </Link>
              <Link
                href="/admin/switch-requests"
                className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Bytförfrågningar
              </Link>
              <Link
                href="/admin/price-updates"
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Prisuppdateringar
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted uppercase tracking-wide">Totalt leads</p>
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              <p className="text-sm text-muted uppercase tracking-wide">Nya</p>
            </div>
            <p className="text-3xl font-bold">{stats.new}</p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <p className="text-sm text-muted uppercase tracking-wide">Konverterade</p>
            </div>
            <p className="text-3xl font-bold">{stats.converted}</p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              <p className="text-sm text-muted uppercase tracking-wide">Total besparing</p>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalSavings)}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(["all", "new", "contacted", "converted", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${filter === f 
                  ? "bg-primary text-white" 
                  : "bg-white border border-border text-muted hover:bg-gray-50"
                }
              `}
            >
              {f === "all" ? "Alla" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-lg border border-border">
          {isLoading ? (
            <div className="p-12 text-center">
              <p className="text-muted">Laddar leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted">Inga leads ännu</p>
              <p className="text-sm text-muted mt-2">
                När användare fyller i kontaktformuläret dyker de upp här.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {lead.email && (
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted" />
                          {lead.email}
                        </p>
                      )}
                      {lead.phone && (
                        <p className="text-sm text-muted flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4" />
                          {lead.phone}
                        </p>
                      )}
                    </div>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${lead.status === "new" && "bg-warning/10 text-warning"}
                      ${lead.status === "contacted" && "bg-primary/10 text-primary"}
                      ${lead.status === "converted" && "bg-success/10 text-success"}
                      ${lead.status === "rejected" && "bg-error/10 text-error"}
                    `}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted">Besparing</p>
                      <p className="font-semibold text-secondary">
                        {formatCurrency(lead.savings.potentialSavings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Förbrukning</p>
                      <p className="font-medium">{lead.billData.totalKWh} kWh</p>
                    </div>
                    <div>
                      <p className="text-muted">Skapad</p>
                      <p className="font-medium">
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
        <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-sm text-muted text-center">
            💡 <strong>Tips:</strong> Leads sparas i databasen och Telegram-notiser skickas vid nya kontaktförfrågningar.
          </p>
        </div>
      </div>
    </main>
  );
}

