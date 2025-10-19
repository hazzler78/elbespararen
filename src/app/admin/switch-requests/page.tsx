"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  User, 
  Home, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Phone,
  Calendar,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { SwitchRequest, ApiResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

export default function SwitchRequestsAdminPage() {
  const [switchRequests, setSwitchRequests] = useState<SwitchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "processing" | "completed">("all");

  useEffect(() => {
    fetchSwitchRequests();
  }, []);

  const fetchSwitchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/switch-requests");
      const result = await response.json() as ApiResponse<SwitchRequest[]>;
      
      if (result.success && result.data) {
        setSwitchRequests(result.data);
      }
    } catch (error) {
      console.error("Error fetching switch requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = filter === "all" 
    ? switchRequests 
    : switchRequests.filter(req => req.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning/10 text-warning";
      case "processing": return "bg-primary/10 text-primary";
      case "completed": return "bg-success/10 text-success";
      case "cancelled": return "bg-error/10 text-error";
      default: return "bg-muted/10 text-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return Clock;
      case "processing": return FileText;
      case "completed": return CheckCircle2;
      case "cancelled": return AlertCircle;
      default: return Clock;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Laddar bytförfrågningar...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka till admin
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bytförfrågningar</h1>
              <p className="text-muted">Hantera alla bytförfrågningar från kunder</p>
            </div>
            <button
              onClick={fetchSwitchRequests}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Uppdatera
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg border border-border p-6"
          >
            <p className="text-sm text-muted uppercase tracking-wide mb-2">Totalt</p>
            <p className="text-3xl font-bold">{switchRequests.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-border p-6"
          >
            <p className="text-sm text-muted uppercase tracking-wide mb-2">Väntande</p>
            <p className="text-3xl font-bold text-warning">
              {switchRequests.filter(r => r.status === "pending").length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg border border-border p-6"
          >
            <p className="text-sm text-muted uppercase tracking-wide mb-2">Bearbetas</p>
            <p className="text-3xl font-bold text-primary">
              {switchRequests.filter(r => r.status === "processing").length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg border border-border p-6"
          >
            <p className="text-sm text-muted uppercase tracking-wide mb-2">Genomförda</p>
            <p className="text-3xl font-bold text-success">
              {switchRequests.filter(r => r.status === "completed").length}
            </p>
          </motion.div>
        </div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6 flex gap-2 flex-wrap"
        >
          {(["all", "pending", "processing", "completed"] as const).map((f) => (
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
        </motion.div>

        {/* Switch Requests List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg border border-border"
        >
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted">Inga bytförfrågningar ännu</p>
              <p className="text-sm text-muted mt-2">
                När kunder skickar bytförfrågningar dyker de upp här.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredRequests.map((request) => {
                const StatusIcon = getStatusIcon(request.status);
                
                return (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">
                            {request.customerInfo.firstName} {request.customerInfo.lastName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <User className="w-4 h-4" />
                            <span>{request.customerInfo.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Phone className="w-4 h-4" />
                            <span>{request.customerInfo.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(request.createdAt).toLocaleDateString("sv-SE")}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Nuvarande leverantör */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Nuvarande leverantör
                            </h4>
                            <p className="font-medium">{request.currentProvider.name}</p>
                            <p className="text-sm text-muted">
                              {formatCurrency(request.currentProvider.currentMonthlyCost)}/månad
                            </p>
                            {request.currentProvider.contractEndDate && (
                              <p className="text-sm text-muted">
                                Avtalslut: {new Date(request.currentProvider.contractEndDate).toLocaleDateString("sv-SE")}
                              </p>
                            )}
                          </div>

                          {/* Ny leverantör */}
                          <div className="bg-primary/10 rounded-lg p-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Ny leverantör
                            </h4>
                            <p className="font-medium">{request.newProvider.name}</p>
                            <p className="text-sm text-muted">{request.newProvider.description}</p>
                          </div>
                        </div>

                        {/* Besparing */}
                        <div className="mt-4 bg-success/10 border border-success/20 rounded-lg p-4">
                          <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Besparing
                          </h4>
                          <p className="text-2xl font-bold text-success">
                            {formatCurrency(request.savings.potentialSavings)} per månad
                          </p>
                          <p className="text-sm text-muted">
                            Från {formatCurrency(request.savings.currentCost)} till {formatCurrency(request.savings.cheapestAlternative)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <StatusIcon className="w-5 h-5 text-muted" />
                      </div>
                    </div>

                    {/* Adress */}
                    <div className="flex items-center gap-2 text-sm text-muted mb-2">
                      <Home className="w-4 h-4" />
                      <span>
                        {request.customerInfo.address.street} {request.customerInfo.address.streetNumber}
                        {request.customerInfo.address.apartment && `, ${request.customerInfo.address.apartment}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted mb-4">
                      <span>
                        {request.customerInfo.address.postalCode} {request.customerInfo.address.city}
                      </span>
                    </div>

                    {/* Referensnummer */}
                    <div className="text-xs text-muted">
                      Referensnummer: {request.id}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-lg"
        >
          <p className="text-sm text-muted text-center">
            💡 <strong>Tips:</strong> Bytförfrågningar sparas för närvarande i mock data. 
            För produktion, konfigurera Cloudflare D1 eller Supabase.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
