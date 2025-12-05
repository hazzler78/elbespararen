"use client";

import { useState, useEffect } from "react";
import { MapPin, AlertCircle, CheckCircle2, Download, Filter, RefreshCw } from "lucide-react";
import { PostalCodeAnalytics, ApiResponse } from "@/lib/types";
import { PRICE_AREAS, isPriceAreaCode } from "@/lib/price-areas";

export default function PostalCodeAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PostalCodeAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterChanged, setFilterChanged] = useState<"all" | "changed" | "not-changed">("all");
  const [filterPageContext, setFilterPageContext] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "postalCode" | "area">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/postal-code-analytics?limit=1000");
      const result = await response.json() as ApiResponse<PostalCodeAnalytics[]>;
      
      if (result.success && result.data) {
        // Konvertera createdAt från sträng till Date-objekt om det behövs
        const processedData = result.data.map(item => ({
          ...item,
          createdAt: item.createdAt instanceof Date 
            ? item.createdAt 
            : new Date(item.createdAt as any)
        }));
        setAnalytics(processedData);
      }
    } catch (error) {
      console.error("Error fetching postal code analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrera och sortera data
  const filteredAnalytics = analytics
    .filter((item) => {
      if (filterArea !== "all" && item.selectedArea !== filterArea) return false;
      if (filterChanged === "changed" && !item.wasManuallyChanged) return false;
      if (filterChanged === "not-changed" && item.wasManuallyChanged) return false;
      if (filterPageContext !== "all" && item.pageContext !== filterPageContext) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "date") {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      } else if (sortBy === "postalCode") {
        comparison = a.postalCode.localeCompare(b.postalCode);
      } else if (sortBy === "area") {
        comparison = a.selectedArea.localeCompare(b.selectedArea);
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Beräkna statistik
  const stats = {
    total: analytics.length,
    manuallyChanged: analytics.filter(a => a.wasManuallyChanged).length,
    byArea: {
      se1: analytics.filter(a => a.selectedArea === 'se1').length,
      se2: analytics.filter(a => a.selectedArea === 'se2').length,
      se3: analytics.filter(a => a.selectedArea === 'se3').length,
      se4: analytics.filter(a => a.selectedArea === 'se4').length,
    },
    byPageContext: {
      upload: analytics.filter(a => a.pageContext === 'upload').length,
      contracts: analytics.filter(a => a.pageContext === 'contracts').length,
      other: analytics.filter(a => !a.pageContext || (a.pageContext !== 'upload' && a.pageContext !== 'contracts')).length,
    },
    mismatches: analytics.filter(a => a.detectedArea && a.detectedArea !== a.selectedArea).length,
  };

  // Exportera till CSV
  const exportToCSV = () => {
    const headers = ['Postnummer', 'Detekterat område', 'Valt område', 'Manuellt ändrat', 'Sida', 'Datum'];
    const rows = filteredAnalytics.map(item => [
      item.postalCode,
      item.detectedArea || '-',
      item.selectedArea,
      item.wasManuallyChanged ? 'Ja' : 'Nej',
      item.pageContext || '-',
      item.createdAt.toLocaleString('sv-SE')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `postal-code-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hämta unika postnummer
  const uniquePostalCodes = Array.from(new Set(analytics.map(a => a.postalCode))).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Postnummer Analytics</h1>
                <p className="text-gray-600">Spåra postnummer och områdesval för marknadsföring</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchAnalytics}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Uppdatera
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportera CSV
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-500 uppercase tracking-wide">Totalt</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-gray-500 uppercase tracking-wide">Manuellt ändrat</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.manuallyChanged}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total > 0 ? ((stats.manuallyChanged / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-red-600" />
                <p className="text-sm text-gray-500 uppercase tracking-wide">Fel detektering</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.mismatches}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total > 0 ? ((stats.mismatches / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <p className="text-sm text-gray-500 uppercase tracking-wide">Unika postnummer</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{uniquePostalCodes.length}</p>
            </div>
          </div>

          {/* Area Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Fördelning per område</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(['se1', 'se2', 'se3', 'se4'] as const).map((area) => (
                <div key={area} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    {isPriceAreaCode(area) ? PRICE_AREAS[area].name : String(area).toUpperCase()}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byArea[area]}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? ((stats.byArea[area] / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Filter</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Område</label>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Alla områden</option>
                  {(['se1', 'se2', 'se3', 'se4'] as const).map((area) => (
                    <option key={area} value={area}>
                      {isPriceAreaCode(area) ? PRICE_AREAS[area].name : String(area).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manuellt ändrat</label>
                <select
                  value={filterChanged}
                  onChange={(e) => setFilterChanged(e.target.value as "all" | "changed" | "not-changed")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Alla</option>
                  <option value="changed">Endast manuellt ändrat</option>
                  <option value="not-changed">Endast automatiskt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sida</label>
                <select
                  value={filterPageContext}
                  onChange={(e) => setFilterPageContext(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Alla sidor</option>
                  <option value="upload">Upload</option>
                  <option value="contracts">Contracts</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <label className="block text-sm font-medium text-gray-700">Sortera efter:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "postalCode" | "area")}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Datum</option>
                <option value="postalCode">Postnummer</option>
                <option value="area">Område</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">Laddar data...</p>
              </div>
            ) : filteredAnalytics.length === 0 ? (
              <div className="p-12 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Ingen data ännu</p>
                <p className="text-sm text-gray-400 mt-2">
                  När användare anger postnummer kommer data att visas här.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Postnummer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detekterat område
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valt område
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sida
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAnalytics.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.postalCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.detectedArea ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {isPriceAreaCode(item.detectedArea) ? PRICE_AREAS[item.detectedArea].name : item.detectedArea.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.wasManuallyChanged 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isPriceAreaCode(item.selectedArea) ? PRICE_AREAS[item.selectedArea].name : item.selectedArea.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.wasManuallyChanged ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Manuellt ändrat
                            </span>
                          ) : item.detectedArea && item.detectedArea !== item.selectedArea ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Fel detektering
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Automatisk
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.pageContext || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.createdAt.toLocaleString('sv-SE')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 text-center">
              💡 <strong>Tips:</strong> Använd denna data för att identifiera problemområden och rikta marknadsföring till specifika postnummer/områden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
