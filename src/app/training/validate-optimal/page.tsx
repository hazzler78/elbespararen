'use client';

import { useState } from 'react';

export default function ValidateOptimalPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setResult(null);
  };

  const testOptimalPrompt = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      console.log('Testing optimal prompt with file:', selectedFile.name);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/parse-bill-v3', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        setResult(data.data);
      } else {
        setResult({ error: data.error });
      }
    } catch (error) {
      console.error('Error testing optimal prompt:', error);
      setResult({ error: 'Fel vid testning av optimal prompt' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🎯 Validera Optimal Prompt
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Testa den förbättrade prompten
            </h2>
            
            <div className="mb-4">
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
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Vald fil: <span className="font-medium">{selectedFile.name}</span>
                </p>
                <button
                  onClick={testOptimalPrompt}
                  disabled={loading}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testar...' : 'Testa Optimal Prompt'}
                </button>
              </div>
            )}
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Resultat:
              </h3>
              
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">❌ {result.error}</p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Grundläggande kostnader:</h4>
                      <p><strong>Elnät:</strong> {result.elnatCost} kr</p>
                      <p><strong>Elhandel:</strong> {result.elhandelCost} kr</p>
                      <p><strong>Total belopp:</strong> {result.totalAmount} kr</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Extra avgifter:</h4>
                      <p><strong>Totalt:</strong> {result.extraFeesTotal} kr</p>
                      <p><strong>Antal:</strong> {result.extraFeesDetailed?.length || 0}</p>
                    </div>
                  </div>
                  
                  {result.extraFeesDetailed && result.extraFeesDetailed.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Detaljerade extra avgifter:</h4>
                      <ul className="space-y-1">
                        {result.extraFeesDetailed.map((fee: any, index: number) => (
                          <li key={index} className="text-sm text-gray-700">
                            {fee.label}: {fee.amount} kr
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Övrig information:</h4>
                    <p><strong>Förbrukning:</strong> {result.totalKWh} kWh</p>
                    <p><strong>Period:</strong> {result.period}</p>
                    <p><strong>Kontraktstyp:</strong> {result.contractType}</p>
                    <p><strong>Confidence:</strong> {result.confidence}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Förbättringar i optimal prompt:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Tydligare separation mellan grundläggande kostnader och extra avgifter</li>
              <li>• Explicit regel att Energiskatt INTE är extra avgift</li>
              <li>• Förbättrad moms-hantering</li>
              <li>• Tydligare instruktioner om att läsa från "Summa"-kolumnen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
