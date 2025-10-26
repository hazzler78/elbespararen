'use client';

import { useState } from 'react';

export default function TestHybridPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setResult(null);
  };

  const testHybridSystem = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      console.log('Testing hybrid system with file:', selectedFile.name);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/parse-bill-v3', {
        method: 'POST',
        body: formData
      });

      const data = await response.json() as { success: boolean; data: any; error?: string };
      console.log('Hybrid system response:', data);

      if (data.success) {
        setResult(data.data);
      } else {
        setResult({ error: data.error });
      }
    } catch (error) {
      console.error('Error testing hybrid system:', error);
      setResult({ error: 'Fel vid test av hybridsystem' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧠 Testa Hybrid AI + Rules System
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Detta system kombinerar AI-analys med regelbaserade korrektioner för att 
              automatiskt fixa vanliga fel som:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>❌ Moms inkluderad som extra avgift</li>
              <li>❌ Energiskatt inkluderad som extra avgift</li>
              <li>❌ Elnätsabonnemang inkluderat som extra avgift</li>
              <li>❌ Medelspotpris inkluderat som extra avgift</li>
              <li>❌ Elöverföring inkluderad som extra avgift</li>
              <li>❌ Öresutjämning inkluderad som extra avgift</li>
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Välj faktura att testa:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {selectedFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>Vald fil:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}

            <button
              onClick={testHybridSystem}
              disabled={!selectedFile || loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '🧠 Analyserar med hybridsystem...' : '🚀 Testa Hybrid System'}
            </button>

            {result && (
              <div className="mt-6">
                {result.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-red-800 font-medium mb-2">❌ Fel</h3>
                    <p className="text-red-700">{result.error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-green-800 font-medium mb-2">✅ Hybrid System Resultat</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total belopp:</span> {result.totalAmount} kr
                        </div>
                        <div>
                          <span className="font-medium">Elnät:</span> {result.elnatCost} kr
                        </div>
                        <div>
                          <span className="font-medium">Elhandel:</span> {result.elhandelCost} kr
                        </div>
                        <div>
                          <span className="font-medium">Extra avgifter:</span> {result.extraFeesTotal} kr
                        </div>
                        <div>
                          <span className="font-medium">Förbrukning:</span> {result.totalKWh} kWh
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span> {(result.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {result.extraFeesDetailed && result.extraFeesDetailed.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Extra avgifter (korrigerade):</h4>
                        <div className="space-y-1">
                          {result.extraFeesDetailed.map((fee: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{fee.label}</span>
                              <span className="font-medium">{fee.amount} kr</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-medium">
                            <span>Totalt extra avgifter:</span>
                            <span>{result.extraFeesTotal} kr</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.warnings && result.warnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 mb-2">⚠️ Varningar:</h4>
                        <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                          {result.warnings.map((warning: string, index: number) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
