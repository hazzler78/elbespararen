"use client";

import { useState } from "react";
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface UpdateResult {
  provider: string;
  action: string;
  success: boolean;
  error?: string;
  data?: any;
}

interface UpdateResponse {
  success: boolean;
  message: string;
  results: UpdateResult[];
  summary: {
    total: number;
    successful: number;
    errors: number;
    preserved_rörliga?: string[];
  };
  preserved_rörliga?: Array<{
    name: string;
    contractType: string;
    reason: string;
  }>;
}

export default function PriceUpdatesAdminPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<UpdateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePrices = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      console.log('[Admin] Starting manual price update...');
      
      const response = await fetch("/api/prices/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json() as UpdateResponse;
      
      if (result.success) {
        setLastUpdate(result);
        console.log('[Admin] Price update completed:', result);
      } else {
        setError(result.message || "Kunde inte uppdatera priser");
      }
    } catch (error) {
      console.error('[Admin] Error updating prices:', error);
      setError(error instanceof Error ? error.message : "Okänt fel");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prisuppdateringar</h1>
                <p className="text-gray-600 mt-1">
                  Hantera automatiska uppdateringar av fastpriser från externa leverantörer
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Automatisk uppdatering: 00:05 varje natt</span>
                  <span className="sm:hidden">Auto: 00:05</span>
                </div>
              </div>
            </div>

            {/* Manuell uppdatering */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Manuell prisuppdatering</h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Kör prisuppdatering manuellt för att testa systemet eller uppdatera priser direkt.
                <br />
                <strong className="text-blue-600">Obs:</strong> Endast Fastpris-leverantörer uppdateras automatiskt. 
                Rörliga leverantörer bevaras och uppdateras inte.
                <br />
                <strong className="text-orange-600">Varning:</strong> Dolda Fastpris-leverantörer kommer att återaktiveras med nya priser.
              </p>
              
              <button
                onClick={handleUpdatePrices}
                disabled={isUpdating}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  isUpdating
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Uppdaterar priser...</span>
                    <span className="sm:hidden">Uppdaterar...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Uppdatera priser nu</span>
                    <span className="sm:hidden">Uppdatera priser</span>
                  </>
                )}
              </button>
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-medium text-red-800">Fel vid prisuppdatering</h3>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {/* Last update results */}
            {lastUpdate && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Senaste uppdatering</h3>
                  <span className="text-sm text-gray-500">
                    ({lastUpdate.summary.successful} lyckades, {lastUpdate.summary.errors} fel)
                  </span>
                </div>

                <div className="grid gap-3">
                  {lastUpdate.results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border ${getStatusColor(result.success)}`}
                    >
                      <div className="flex items-center gap-3 mb-2 sm:mb-0">
                        {getStatusIcon(result.success)}
                        <div>
                          <p className="font-medium">{result.provider}</p>
                          <p className="text-sm opacity-75">
                            {result.action === 'created' && 'Skapad ny leverantör'}
                            {result.action === 'created_alternative' && 'Skapad avtalsalternativ'}
                            {result.action === 'updated' && 'Uppdaterad befintlig leverantör'}
                            {result.action === 'reactivated' && 'Återaktiverad leverantör med nya priser'}
                            {result.action === 'updated_hidden' && 'Uppdaterad dold leverantör (förblir dold)'}
                            {result.action === 'fetch_failed' && 'Kunde inte hämta priser'}
                            {result.action === 'error' && 'Fel vid bearbetning'}
                          </p>
                        </div>
                      </div>
                      {result.error && (
                        <div className="text-sm opacity-75">
                          {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Visa bevarade Rörliga leverantörer */}
                {lastUpdate.preserved_rörliga && lastUpdate.preserved_rörliga.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-blue-500" />
                      <h4 className="font-semibold text-blue-800">Bevarade Rörliga leverantörer</h4>
                    </div>
                    <div className="grid gap-2">
                      {lastUpdate.preserved_rörliga.map((provider, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div>
                            <p className="font-medium text-blue-900">{provider.name}</p>
                            <p className="text-sm text-blue-700">{provider.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Information om leverantörer */}
            <div className="mt-8 bg-blue-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Fastpris-leverantörer som uppdateras</h3>
              <p className="text-sm text-blue-700 mb-4">
                Dessa leverantörer hämtar priser automatiskt från externa endpoints varje natt kl. 00:05.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Cheap Energy", endpoint: "cheapenergy_v2" },
                  { name: "Energi2", endpoint: "energi2_v2" },
                  { name: "Stockholms El", endpoint: "sthlmsel_v2" },
                  { name: "Svealands EL", endpoint: "svealandsel_v2" },
                  { name: "Svekraft", endpoint: "svekraft_v2" },
                  { name: "Motala El", endpoint: "motala_v2" }
                ].map((provider) => (
                  <div key={provider.endpoint} className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="font-medium text-gray-900">{provider.name}</h4>
                    <p className="text-sm text-gray-500">{provider.endpoint}</p>
                    <p className="text-xs text-blue-600 mt-1">Fastpris</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
