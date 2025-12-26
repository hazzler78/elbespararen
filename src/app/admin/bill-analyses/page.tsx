"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle2, XCircle, AlertCircle, Eye, Filter, Search, Calendar, Image as ImageIcon } from "lucide-react";
import { BillAnalysis, ApiResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

export default function BillAnalysesPage() {
  const [analyses, setAnalyses] = useState<BillAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<BillAnalysis['validationStatus'] | 'all'>('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<BillAnalysis | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationNotes, setValidationNotes] = useState("");
  const [validationStatus, setValidationStatus] = useState<BillAnalysis['validationStatus']>('pending');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    fetchAnalyses();
  }, [filter]);

  const fetchAnalyses = async () => {
    try {
      setIsLoading(true);
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;
      const response = await fetch(`/api/bill-analyses${statusParam}`);
      if (response.ok) {
        const data = await response.json() as { success: boolean; data: BillAnalysis[]; count: number };
        console.log('[bill-analyses] Fetched analyses:', data.data?.length || 0);
        setAnalyses(data.data || []);
      } else {
        const errorText = await response.text();
        console.error('Kunde inte hämta fakturaanalyser:', response.status, response.statusText, errorText);
        alert(`Kunde inte hämta fakturaanalyser: ${response.statusText}. Kontrollera browser console för detaljer.`);
      }
    } catch (error) {
      console.error('Fel vid hämtning av fakturaanalyser:', error);
      alert(`Fel vid hämtning av fakturaanalyser: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: BillAnalysis['validationStatus'], notes?: string) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/bill-analyses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validationStatus: status,
          validationNotes: notes || '',
          validatedBy: 'admin' // I produktion, hämta från session/auth
        }),
      });

      if (response.ok) {
        await fetchAnalyses();
        setSelectedAnalysis(null);
        setValidationNotes("");
      } else {
        alert('Kunde inte uppdatera status');
      }
    } catch (error) {
      console.error('Fel vid uppdatering:', error);
      alert('Ett fel uppstod vid uppdatering');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectAnalysis = async (analysis: BillAnalysis) => {
    setSelectedAnalysis(analysis);
    setValidationStatus(analysis.validationStatus);
    setValidationNotes(analysis.validationNotes || "");
    setImageUrl(null);
    
    // Hämta bild-URL om imageKey finns
    if (analysis.imageKey) {
      setIsLoadingImage(true);
      try {
        const response = await fetch(`/api/bill-images/${encodeURIComponent(analysis.imageKey)}`);
        if (response.ok) {
          const data = await response.json() as { success: boolean; url?: string };
          if (data.success && data.url) {
            setImageUrl(data.url);
          }
        } else {
          console.error('Kunde inte hämta bild-URL:', response.statusText);
        }
      } catch (error) {
        console.error('Fel vid hämtning av bild-URL:', error);
      } finally {
        setIsLoadingImage(false);
      }
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        analysis.originalFileName?.toLowerCase().includes(searchLower) ||
        analysis.postalCode?.toLowerCase().includes(searchLower) ||
        analysis.billData.period?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusColor = (status: BillAnalysis['validationStatus']) => {
    switch (status) {
      case 'correct':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'incorrect':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: BillAnalysis['validationStatus']) => {
    switch (status) {
      case 'correct':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'incorrect':
        return <XCircle className="w-4 h-4" />;
      case 'needs_review':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const statusCounts = {
    all: analyses.length,
    pending: analyses.filter(a => a.validationStatus === 'pending').length,
    correct: analyses.filter(a => a.validationStatus === 'correct').length,
    incorrect: analyses.filter(a => a.validationStatus === 'incorrect').length,
    needs_review: analyses.filter(a => a.validationStatus === 'needs_review').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Fakturaanalyser</h1>
            <p className="text-gray-600">Granska AI-analyser och besparingsuppskattningar för att identifiera fel</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Totalt</div>
              <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Väntar</div>
              <div className="text-2xl font-bold text-gray-600">{statusCounts.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-green-600">Korrekt</div>
              <div className="text-2xl font-bold text-green-600">{statusCounts.correct}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-red-600">Felaktig</div>
              <div className="text-2xl font-bold text-red-600">{statusCounts.incorrect}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-yellow-600">Granska</div>
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.needs_review}</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Sök efter filnamn, postnummer eller period..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {(['all', 'pending', 'correct', 'incorrect', 'needs_review'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'Alla' : status === 'pending' ? 'Väntar' : status === 'correct' ? 'Korrekt' : status === 'incorrect' ? 'Felaktig' : 'Granska'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Analyses List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Laddar analyser...</p>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Inga fakturaanalyser hittades</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filnamn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bild
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Förbrukning
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total belopp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Besparing
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Åtgärd
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {analysis.originalFileName || 'Okänt'}
                          </div>
                          {analysis.postalCode && (
                            <div className="text-xs text-gray-500">{analysis.postalCode}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {analysis.imageKey ? (
                            <div className="flex items-center text-green-600" title="Bild tillgänglig">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="text-gray-400" title="Ingen bild">
                              —
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.billData.period || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.billData.totalKWh} kWh
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(analysis.billData.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(analysis.savings.potentialSavings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {analysis.aiConfidence ? `${(analysis.aiConfidence * 100).toFixed(0)}%` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(analysis.validationStatus)}`}>
                            {getStatusIcon(analysis.validationStatus)}
                            {analysis.validationStatus === 'pending' ? 'Väntar' : 
                             analysis.validationStatus === 'correct' ? 'Korrekt' : 
                             analysis.validationStatus === 'incorrect' ? 'Felaktig' : 'Granska'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleSelectAnalysis(analysis)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Granska
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Fakturaanalys</h2>
                  <p className="text-sm text-gray-600">
                    {selectedAnalysis.originalFileName || 'Okänt filnamn'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(selectedAnalysis.createdAt).toLocaleString('sv-SE')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Bill Image */}
              {selectedAnalysis.imageKey && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Fakturabild</h3>
                  {isLoadingImage ? (
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Laddar bild...</span>
                    </div>
                  ) : imageUrl ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img 
                        src={imageUrl} 
                        alt={`Faktura: ${selectedAnalysis.originalFileName || 'Okänt'}`}
                        className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
                        onError={() => {
                          console.error('Kunde inte ladda bild');
                          setImageUrl(null);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Bildnyckel: {selectedAnalysis.imageKey}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Kunde inte ladda bild</p>
                        <p className="text-xs text-gray-500 mt-1">Bildnyckel: {selectedAnalysis.imageKey}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bill Data */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fakturadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total belopp</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedAnalysis.billData.totalAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Förbrukning</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAnalysis.billData.totalKWh} kWh
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Elnät</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedAnalysis.billData.elnatCost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Elhandel</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedAnalysis.billData.elhandelCost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Extra avgifter</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedAnalysis.billData.extraFeesTotal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Period</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAnalysis.billData.period || 'N/A'}
                    </div>
                  </div>
                </div>

                {selectedAnalysis.billData.extraFeesDetailed.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Extra avgifter detaljer:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedAnalysis.billData.extraFeesDetailed.map((fee, idx) => (
                        <li key={idx} className="text-sm text-gray-600">
                          {fee.label}: {formatCurrency(fee.amount)} (confidence: {(fee.confidence * 100).toFixed(0)}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Savings Calculation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Besparingsberäkning</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Nuvarande kostnad</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedAnalysis.savings.currentCost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Potentiell besparing</div>
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedAnalysis.savings.potentialSavings)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Billigaste alternativ</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedAnalysis.savings.cheapestAlternative)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Besparing i procent</div>
                    <div className="text-lg font-semibold text-green-600">
                      {selectedAnalysis.savings.savingsPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Confidence</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAnalysis.aiConfidence ? `${(selectedAnalysis.aiConfidence * 100).toFixed(0)}%` : 'N/A'}
                    </div>
                  </div>
                  {selectedAnalysis.aiWarnings && selectedAnalysis.aiWarnings.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600">Varningar</div>
                      <ul className="list-disc list-inside">
                        {selectedAnalysis.aiWarnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-yellow-600">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Validering</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={validationStatus}
                      onChange={(e) => setValidationStatus(e.target.value as BillAnalysis['validationStatus'])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Väntar</option>
                      <option value="correct">Korrekt</option>
                      <option value="incorrect">Felaktig</option>
                      <option value="needs_review">Behöver granskas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anteckningar
                    </label>
                    <textarea
                      value={validationNotes}
                      onChange={(e) => setValidationNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Beskriv eventuella fel eller observationer..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedAnalysis.id, validationStatus, validationNotes)}
                      disabled={isUpdating}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Sparar...' : 'Spara validering'}
                    </button>
                    <button
                      onClick={() => setSelectedAnalysis(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

