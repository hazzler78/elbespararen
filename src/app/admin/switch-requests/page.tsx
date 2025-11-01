"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ArrowRight,
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
  const [sortBy, setSortBy] = useState<"date" | "provider" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

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

  const updateSwitchRequestStatus = async (id: string, status: string) => {
    try {
      console.log('[Admin] Updating switch request status:', id, status);
      const response = await fetch("/api/switch-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status
        }),
      });

      const result = await response.json() as ApiResponse<SwitchRequest>;
      
      if (result.success && result.data) {
        setSwitchRequests(switchRequests.map(req => req.id === id ? result.data! : req));
        alert('✅ Status uppdaterad!');
      } else {
        alert('❌ Kunde inte uppdatera status: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error("Error updating switch request status:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const addNoteToSwitchRequest = async (id: string, note: string) => {
    try {
      console.log('[Admin] Adding note to switch request:', id, note);
      const response = await fetch("/api/switch-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          notes: note
        }),
      });

      const result = await response.json() as ApiResponse<SwitchRequest>;
      
      if (result.success && result.data) {
        setSwitchRequests(switchRequests.map(req => req.id === id ? result.data! : req));
        alert('✅ Anteckning tillagd!');
      } else {
        alert('❌ Kunde inte lägga till anteckning: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error("Error adding note to switch request:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const deleteSwitchRequest = async (id: string) => {
    if (!confirm(`Är du säker på att du vill ta bort denna bytförfrågan? (ID: ${id})\n\nDetta kan inte ångras!`)) {
      return;
    }

    try {
      console.log('[Admin] Deleting switch request:', id);
      const response = await fetch(`/api/switch-requests?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const result = await response.json() as ApiResponse<{ message?: string }>;
      
      if (result.success) {
        setSwitchRequests(switchRequests.filter(req => req.id !== id));
        alert('✅ Bytförfrågan borttagen!');
      } else {
        alert('❌ Kunde inte ta bort bytförfrågan: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error("Error deleting switch request:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const deleteSelectedSwitchRequests = async () => {
    if (selectedRequests.size === 0) {
      alert('Välj minst en förfrågan att ta bort');
      return;
    }

    if (!confirm(`Är du säker på att du vill ta bort ${selectedRequests.size} bytförfrågningar?\n\nDetta kan inte ångras!`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedRequests).map(id => 
        fetch(`/api/switch-requests?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.all(deletePromises);
      const jsonResults = await Promise.all(results.map(r => r.json())) as ApiResponse<{ message?: string }>[];
      
      const successCount = jsonResults.filter(r => r.success).length;
      const failedCount = jsonResults.length - successCount;

      // Uppdatera listan
      setSwitchRequests(switchRequests.filter(req => !selectedRequests.has(req.id)));
      setSelectedRequests(new Set());

      if (failedCount === 0) {
        alert(`✅ ${successCount} bytförfrågningar borttagna!`);
      } else {
        alert(`⚠️ ${successCount} borttagna, ${failedCount} misslyckades`);
      }
    } catch (error) {
      console.error("Error deleting switch requests:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const toggleRequestSelection = (id: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const visibleIds = filteredRequests.map(req => req.id);
    setSelectedRequests(new Set(visibleIds));
  };

  const clearSelection = () => {
    setSelectedRequests(new Set());
  };

  const exportSelectedToCSV = async () => {
    if (selectedRequests.size === 0) {
      alert('Välj minst en förfrågan att exportera');
      return;
    }

    const selectedData = filteredRequests.filter(req => selectedRequests.has(req.id));
    
    // Skapa CSV-huvud
    const headers = [
      'Avtalspris',
      'Avtalsform',
      'Bindning',
      'Månadsavgift',
      'Påslag',
      'Elcertifikat',
      'Rabatt',
      'Total',
      'Elursprung',
      'Förbrukning',
      'Betalsätt',
      'Namn 1',
      'Namn 2',
      'KundTyp',
      'Person-/orgnummer',
      'Personnrtyp',
      'Anl. adress',
      'Anl. postnr.',
      'Anl. ort',
      'Kundadress',
      'Kundpostnr.',
      'Kundort',
      'Kundland',
      'Telefon 1',
      'Telefon 2',
      'E-post',
      'Anläggningsnr',
      'Områdes-id',
      'Leveransdatum',
      'Importtyp',
      'Avtals-id',
      'Fullmakt-förnamn',
      'Fullmakt-efternamn',
      'Fullmakt personnr',
      'Orderdatum',
      'Order-id',
      'Agentnamn',
      'Ljudfilsnamn',
      'Ljudkontrollant',
      'Säljar-id',
      'Kontors-id',
      'Debiteringsgrupp',
      'Andel reducerad energiskatt'
    ];

    // Skapa CSV-data
    const lookups = await Promise.all(selectedData.map(async (req) => {
      try {
        const area = (req.billData.priceArea || 'se3').toLowerCase();
        const res = await fetch('/api/prices/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerName: req.newProvider.name, area, kwh: req.billData.totalKWh })
        });
        const json = await res.json() as { success?: boolean; data?: { price?: number; total?: number } };
        return json?.success ? (json.data || {}) : {};
      } catch {
        return {} as { price?: number; total?: number };
      }
    }));

    const csvData = selectedData.map((req, idx) => {
      const provider = req.newProvider;
      const customer = req.customerInfo;
      const address = customer.address;
      const lookup = lookups[idx] as { price?: number; total?: number };

      // Avtalspris = spotpris (öre/kWh) från lookup.price
      const avtalspris = typeof lookup?.price === 'number' ? lookup.price : '';
      
      const avtalsform = provider.contractType === 'fastpris' ? 'fastavtal' : 'rörligt';
      const bindning = provider.contractLength ?? '';
      const manadsavgift = provider.monthlyFee ?? '';
      const paslag = provider.contractType === 'rörligt' ? (provider.energyPrice ?? '') : '';
      const elcertifikat = ''; // Saknas i datamodellen
      const rabatt = (typeof provider.freeMonths === 'number' && provider.freeMonths > 0) ? `${provider.freeMonths} fria mån` : '';
      
      const forbrukning = req.billData.totalKWh;
      // Total = total (exkl moms) från lookup.total (öre/kWh)
      const total = typeof lookup?.total === 'number' ? lookup.total : '';
      
      const elursprung = 'NordenMix';
      const forbrukningKwh = forbrukning;
      const betalsatt = customer.paymentMethod || '';
      const namn1 = `${customer.firstName} ${customer.lastName}`;
      const namn2 = ''; // Lämnas tomt
      const kundtyp = 'K'; // K = privatavtal (standard)
      const personOrgNummer = customer.personalNumber || '';
      const personnrtyp = customer.personalNumber ? 'S' : ''; // S = privatavtal
      const anlAdress = `${address.street} ${address.streetNumber}${address.apartment ? `, ${address.apartment}` : ''}`;
      const anlPostnr = address.postalCode;
      const anlOrt = address.city;
      const kundadress = anlAdress;
      const kundpostnr = address.postalCode;
      const kundort = address.city;
      const kundland = 'SE';
      const telefon1 = customer.phone;
      const telefon2 = ''; // Saknas i datamodellen
      const epost = customer.email;
      const anlaggningsnr = req.currentProvider.customerNumber || '';
      const omradesId = ''; // Saknas i datamodellen
      const leveransdatum = ''; // Saknas i datamodellen
      const importtyp = '0'; // 0 = Leverantörsbyte
      const avtalsId = req.id;
      const fullmaktFornamn = customer.firstName;
      const fullmaktEfternamn = customer.lastName;
      const fullmaktPersonnr = customer.personalNumber || '';
      const orderdatum = new Date(req.createdAt).toLocaleDateString('sv-SE');
      const orderId = req.id;
      const agentnamn = provider.name;
      const ljudfilsnamn = ''; // Internt QA-fält
      const ljudkontrollant = ''; // Internt QA-fält
      const saljarId = ''; // Internt fält
      const kontorsId = ''; // Internt fält
      const debiteringsgrupp = 'Elchef.se';
      const andelReduceradEnergiskatt = ''; // Saknas i datamodellen

      return [
        avtalspris,
        avtalsform,
        bindning,
        manadsavgift,
        paslag,
        elcertifikat,
        rabatt,
        total,
        elursprung,
        forbrukningKwh,
        betalsatt,
        namn1,
        namn2,
        kundtyp,
        personOrgNummer,
        personnrtyp,
        anlAdress,
        anlPostnr,
        anlOrt,
        kundadress,
        kundpostnr,
        kundort,
        kundland,
        telefon1,
        telefon2,
        epost,
        anlaggningsnr,
        omradesId,
        leveransdatum,
        importtyp,
        avtalsId,
        fullmaktFornamn,
        fullmaktEfternamn,
        fullmaktPersonnr,
        orderdatum,
        orderId,
        agentnamn,
        ljudfilsnamn,
        ljudkontrollant,
        saljarId,
        kontorsId,
        debiteringsgrupp,
        andelReduceradEnergiskatt
      ];
    });

    // Kombinera headers och data
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Ladda ner CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bytforfragningar_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✅ Exporterade ${selectedRequests.size} förfrågningar till CSV`);
  };

  const filteredRequests = (() => {
    let filtered = filter === "all" 
      ? switchRequests 
      : switchRequests.filter(req => req.status === filter);
    
    // Sortera baserat på vald kolumn och ordning
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "provider":
          comparison = a.newProvider.name.localeCompare(b.newProvider.name);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  })();

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
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Bytförfrågningar</h1>
                <p className="text-gray-600">Hantera alla bytförfrågningar från kunder</p>
              </div>
              <button
                onClick={fetchSwitchRequests}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start sm:self-auto"
              >
                Uppdatera
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-2">Totalt</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{switchRequests.length}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-2">Väntande</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                {switchRequests.filter(r => r.status === "pending").length}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-2">Bearbetas</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                {switchRequests.filter(r => r.status === "processing").length}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-2">Genomförda</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                {switchRequests.filter(r => r.status === "completed").length}
              </p>
            </div>
          </div>

          {/* Filter och Sortering */}
          <div className="mb-6 space-y-4">
            {/* Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filtrera efter status</h3>
              <div className="flex gap-2 flex-wrap">
                {(["all", "pending", "processing", "completed"] as const).map((f) => (
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

            {/* Sortering */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sortera efter</h3>
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "date" | "provider" | "status")}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date">Datum</option>
                    <option value="provider">Leverantör</option>
                    <option value="status">Status</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    {sortOrder === "asc" ? "↑" : "↓"} 
                    {sortOrder === "asc" ? "Stigande" : "Fallande"}
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Visar {filteredRequests.length} av {switchRequests.length} förfrågningar
                </div>
              </div>
            </div>

            {/* Export-kontroller */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Exportera valda förfrågningar</h3>
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex gap-2">
                  <button
                    onClick={selectAllVisible}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Välj alla synliga
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Rensa val
                  </button>
                  <button
                    onClick={exportSelectedToCSV}
                    disabled={selectedRequests.size === 0}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Exportera till CSV ({selectedRequests.size})
                  </button>
                  <button
                    onClick={deleteSelectedSwitchRequests}
                    disabled={selectedRequests.size === 0}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Ta bort valda ({selectedRequests.size})
                  </button>
                </div>
                
                {selectedRequests.size > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    {selectedRequests.size} förfrågningar valda
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Switch Requests List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {filteredRequests.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <ArrowRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Inga bytförfrågningar ännu</p>
                <p className="text-sm text-gray-400 mt-2">
                  När kunder skickar bytförfrågningar dyker de upp här.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredRequests.map((request) => {
                  const StatusIcon = getStatusIcon(request.status);
                  
                  return (
                    <div key={request.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedRequests.has(request.id)}
                            onChange={() => toggleRequestSelection(request.id)}
                            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                              {request.customerInfo.firstName} {request.customerInfo.lastName}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium self-start ${
                              request.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              request.status === "processing" ? "bg-blue-100 text-blue-800" :
                              request.status === "completed" ? "bg-green-100 text-green-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {request.status}
                            </span>
                          </div>
                        
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <User className="w-4 h-4" />
                              <span>{request.customerInfo.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="w-4 h-4" />
                              <span>{request.customerInfo.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(request.createdAt).toLocaleDateString("sv-SE")}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Nuvarande leverantör */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-900">
                                <FileText className="w-4 h-4" />
                                Nuvarande leverantör
                              </h4>
                              <p className="font-medium text-gray-900">{request.currentProvider.name}</p>
                              <p className="text-sm text-gray-600">
                                {formatCurrency(request.currentProvider.currentMonthlyCost)}/månad
                              </p>
                              {request.currentProvider.contractEndDate && (
                                <p className="text-sm text-gray-600">
                                  Avtalslut: {new Date(request.currentProvider.contractEndDate).toLocaleDateString("sv-SE")}
                                </p>
                              )}
                            </div>

                            {/* Ny leverantör */}
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                                <CheckCircle2 className="w-4 h-4" />
                                Ny leverantör
                              </h4>
                              <p className="font-medium text-gray-900">{request.newProvider.name}</p>
                              <p className="text-sm text-gray-600">{request.newProvider.description}</p>
                            </div>
                          </div>

                          {/* Besparing */}
                          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Besparing
                            </h4>
                            <p className="text-xl sm:text-2xl font-bold text-green-600">
                              {formatCurrency(request.savings.potentialSavings)} per månad
                            </p>
                            <p className="text-sm text-gray-600">
                              Från {formatCurrency(request.savings.currentCost)} till {formatCurrency(request.savings.cheapestAlternative)}
                            </p>
                          </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 lg:ml-4 lg:mt-0 mt-4">
                          <StatusIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      {/* Adress */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Home className="w-4 h-4" />
                        <span>
                          {request.customerInfo.address.street} {request.customerInfo.address.streetNumber}
                          {request.customerInfo.address.apartment && `, ${request.customerInfo.address.apartment}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <span>
                          {request.customerInfo.address.postalCode} {request.customerInfo.address.city}
                        </span>
                      </div>

                      {/* Referensnummer */}
                      <div className="text-xs text-gray-500 mb-4">
                        Referensnummer: {request.id}
                      </div>

                      {/* Admin Actions */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex flex-wrap gap-3 mb-4">
                          {/* Status Update Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {request.status !== "processing" && (
                              <button
                                onClick={() => updateSwitchRequestStatus(request.id, "processing")}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Markera som bearbetas
                              </button>
                            )}
                            {request.status !== "completed" && (
                              <button
                                onClick={() => updateSwitchRequestStatus(request.id, "completed")}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Markera som slutförd
                              </button>
                            )}
                            {request.status !== "cancelled" && (
                              <button
                                onClick={() => updateSwitchRequestStatus(request.id, "cancelled")}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Avbryt
                              </button>
                            )}
                            <button
                              onClick={() => deleteSwitchRequest(request.id)}
                              className="px-3 py-1 bg-red-800 text-white text-sm rounded-lg hover:bg-red-900 transition-colors"
                            >
                              Ta bort
                            </button>
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium mb-2 text-gray-900">Anteckningar</h5>
                          {request.notes ? (
                            <p className="text-sm text-gray-600 mb-3">{request.notes}</p>
                          ) : (
                            <p className="text-sm text-gray-500 mb-3 italic">Inga anteckningar än</p>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Lägg till anteckning..."
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const note = e.currentTarget.value.trim();
                                  if (note) {
                                    addNoteToSwitchRequest(request.id, note);
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                const note = input.value.trim();
                                if (note) {
                                  addNoteToSwitchRequest(request.id, note);
                                  input.value = '';
                                }
                              }}
                              className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Lägg till
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 text-center">
              ✅ <strong>Klart!</strong> Bytförfrågningar sparas nu i Cloudflare D1 databasen. 
              Du kan uppdatera status och lägga till anteckningar för varje förfrågan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
