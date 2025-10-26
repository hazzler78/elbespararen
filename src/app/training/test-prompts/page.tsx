'use client';

import { useState } from 'react';
import { getAllPromptVariants } from '@/lib/prompt-variants';

export default function TestPromptsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const promptVariants = getAllPromptVariants();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setResults([]);
  };

  const testAllPrompts = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const testResults: any[] = [];

    for (const variant of promptVariants) {
      try {
        console.log(`Testing prompt: ${variant.name}`);
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('prompt', variant.prompt);

        const response = await fetch('/api/parse-bill-v3', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        
        testResults.push({
          promptName: variant.name,
          promptDescription: variant.description,
          success: data.success,
          result: data.data,
          error: data.error
        });
      } catch (error) {
        testResults.push({
          promptName: variant.name,
          promptDescription: variant.description,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Testa Prompt-varianter
          </h1>
          
          <div className="mb-6">
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
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Vald fil: {selectedFile.name}
              </p>
              <button
                onClick={testAllPrompts}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testar...' : 'Testa alla prompts'}
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Testresultat
              </h2>
              
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {result.promptName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'Framgång' : 'Fel'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {result.promptDescription}
                  </p>

                  {result.success && result.result ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Resultat:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total belopp:</span> {result.result.totalAmount} kr
                        </div>
                        <div>
                          <span className="font-medium">Elnät:</span> {result.result.elnatCost} kr
                        </div>
                        <div>
                          <span className="font-medium">Elhandel:</span> {result.result.elhandelCost} kr
                        </div>
                        <div>
                          <span className="font-medium">Extra avgifter:</span> {result.result.extraFeesTotal} kr
                        </div>
                        <div>
                          <span className="font-medium">Förbrukning:</span> {result.result.totalKWh} kWh
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span> {Math.round((result.result.confidence || 0) * 100)}%
                        </div>
                      </div>
                      
                      {result.result.extraFeesDetailed && result.result.extraFeesDetailed.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-gray-900 mb-2">Extra avgifter detalj:</h5>
                          <ul className="space-y-1">
                            {result.result.extraFeesDetailed.map((fee: any, feeIndex: number) => (
                              <li key={feeIndex} className="text-sm">
                                {fee.label}: {fee.amount} kr
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">Fel:</h4>
                      <p className="text-red-700">{result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
