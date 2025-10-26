'use client';

import { useState } from 'react';
import { BillData } from '@/lib/types';

interface TrainingResult {
  id: string;
  image: string;
  aiResult: BillData;
  userFeedback?: 'correct' | 'incorrect';
  userCorrections?: Partial<BillData>;
  timestamp: Date;
}

export default function TrainingPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<TrainingResult | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<TrainingResult[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setFeedback('');

    try {
      // Konvertera bild till base64
      const base64 = await convertToBase64(file);
      
      // Skicka till AI för analys
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/parse-bill-v3', {
        method: 'POST',
        body: formData
      });

      const result = await response.json() as { success: boolean; data: any; error?: string };
      console.log('API Response:', result);
      
      if (result.success && result.data) {
        const trainingResult: TrainingResult = {
          id: Date.now().toString(),
          image: base64,
          aiResult: result.data,
          timestamp: new Date()
        };
        
        setCurrentResult(trainingResult);
        setFeedback('✅ AI analys klar! Granska resultatet och ge feedback.');
      } else {
        setFeedback('❌ Fel vid analys: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error('Träningsfel:', error);
      setFeedback('❌ Fel vid uppladdning: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedback = async (isCorrect: boolean) => {
    if (!currentResult) return;

    const updatedResult: TrainingResult = {
      ...currentResult,
      userFeedback: isCorrect ? 'correct' : 'incorrect'
    };

    try {
      // Skicka feedback till API
      const response = await fetch('/api/training/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedResult)
      });

      if (response.ok) {
        const result = await response.json() as { insights?: any };
        setTrainingHistory(prev => [...prev, updatedResult]);
        setCurrentResult(null);
        
        if (result.insights) {
          setFeedback(isCorrect ? 
            '👍 Tack! AI:n lär sig av rätt svar.' : 
            `👎 Tack! AI:n lär sig av ditt feedback. ${result.insights.commonErrors.length > 0 ? 'Identifierade förbättringsområden.' : ''}`
          );
        } else {
          setFeedback(isCorrect ? '👍 Tack! AI:n lär sig av rätt svar.' : '👎 Tack! Vi förbättrar AI:n baserat på din feedback.');
        }
      } else {
        setFeedback('❌ Fel vid sparande av feedback');
      }
    } catch (error) {
      setFeedback('❌ Fel vid sparande av feedback');
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getAccuracy = () => {
    const total = trainingHistory.length;
    const correct = trainingHistory.filter(r => r.userFeedback === 'correct').length;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧠 AI-träning för Elbespararen
          </h1>
          
          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Tränade fakturor</h3>
              <p className="text-2xl font-bold text-blue-600">{trainingHistory.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Noggrannhet</h3>
              <p className="text-2xl font-bold text-green-600">{getAccuracy()}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Senaste träning</h3>
              <p className="text-sm text-purple-600">
                {trainingHistory.length > 0 
                  ? trainingHistory[trainingHistory.length - 1].timestamp.toLocaleString()
                  : 'Ingen träning än'
                }
              </p>
            </div>
          </div>

          {/* Filuppladdning */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isAnalyzing}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Ladda upp en faktura för träning
              </h3>
              <p className="text-gray-500 mb-4">
                Klicka här för att välja en bild av din elräkning
              </p>
              <div className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                {isAnalyzing ? 'Analyserar...' : 'Välj fil'}
              </div>
            </label>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-4 rounded-lg mb-6 ${
              feedback.includes('✅') || feedback.includes('👍') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {feedback}
            </div>
          )}

          {/* Aktuellt resultat */}
          {currentResult && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">AI-analys resultat:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Grundläggande data:</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Elnätskostnad:</strong> {currentResult.aiResult.elnatCost} kr</div>
                    <div><strong>Energikostnad:</strong> {currentResult.aiResult.elhandelCost} kr</div>
                    <div><strong>Total summa:</strong> {currentResult.aiResult.totalAmount} kr</div>
                    <div><strong>Förbrukning:</strong> {currentResult.aiResult.totalKWh} kWh</div>
                    <div><strong>Period:</strong> {currentResult.aiResult.period}</div>
                    <div><strong>Avtalstyp:</strong> {currentResult.aiResult.contractType}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Extra avgifter:</h4>
                  <div className="space-y-1 text-sm">
                    {currentResult.aiResult.extraFeesDetailed.map((fee, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{fee.label}:</span>
                        <span>{fee.amount} kr</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 font-semibold">
                      <span>Totalt extra avgifter:</span>
                      <span>{currentResult.aiResult.extraFeesTotal} kr</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => handleFeedback(true)}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  👍 Rätt!
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  👎 Fel
                </button>
              </div>
            </div>
          )}

          {/* Träningshistorik */}
          {trainingHistory.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Träningshistorik:</h3>
              <div className="space-y-2">
                {trainingHistory.slice(-5).reverse().map((result) => (
                  <div key={result.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                    <div>
                      <span className="font-medium">
                        {result.timestamp.toLocaleString()}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        Total: {result.aiResult.totalAmount} kr
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.userFeedback === 'correct' && (
                        <span className="text-green-600">✅ Rätt</span>
                      )}
                      {result.userFeedback === 'incorrect' && (
                        <span className="text-red-600">❌ Fel</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
