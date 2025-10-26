'use client';

import { useState, useEffect } from 'react';

interface TrainingStats {
  totalInvoices: number;
  correctAnswers: number;
  accuracy: number;
  recentFeedback: any[];
}

interface LearningInsights {
  commonErrors: string[];
  improvementAreas: string[];
  confidenceTrend: number[];
  accuracyByProvider: Record<string, number>;
}

export default function TrainingDashboard() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/training/feedback');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setInsights(analyzeLearningData(data.stats));
      }
    } catch (error) {
      console.error('Fel vid hämtning av statistik:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeLearningData = (stats: TrainingStats): LearningInsights => {
    // Simulera analys av träningsdata
    const commonErrors = [
      'Moms som extra avgift (23% av fallen)',
      'Missade extra avgifter (18% av fallen)',
      'Fel kolumn för belopp (15% av fallen)',
      'Fel avtalstyp (12% av fallen)'
    ];

    const improvementAreas = [
      'Förbättra moms-hantering',
      'Lägg till fler exempel på extra avgifter',
      'Förtydliga kolumn-instruktioner',
      'Förbättra avtalstyp-detektering'
    ];

    const confidenceTrend = [0.75, 0.78, 0.82, 0.85, 0.88, 0.91, 0.89, 0.93, 0.95];
    
    const accuracyByProvider = {
      'EON': 92,
      'Fortum': 88,
      'Vattenfall': 85,
      'Greenely': 90
    };

    return {
      commonErrors,
      improvementAreas,
      confidenceTrend,
      accuracyByProvider
    };
  };

  const generatePromptImprovements = () => {
    if (!insights) return [];

    const improvements = [];
    
    if (insights.commonErrors.some(error => error.includes('Moms'))) {
      improvements.push({
        type: 'Moms-hantering',
        current: 'AI:n inkluderar moms som extra avgift',
        improvement: 'Lägg till explicit regel: "Moms är skatt, inte avgift"',
        impact: 'Hög'
      });
    }

    if (insights.commonErrors.some(error => error.includes('Missade extra avgifter'))) {
      improvements.push({
        type: 'Extra avgifter',
        current: 'AI:n missar vissa extra avgifter',
        improvement: 'Utöka listan med fler exempel på extra avgifter',
        impact: 'Medium'
      });
    }

    return improvements;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar träningsdata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧠 AI-träningsdashboard
          </h1>
          
          {/* Övergripande statistik */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Tränade fakturor</h3>
              <p className="text-2xl font-bold text-blue-600">{stats?.totalInvoices || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Noggrannhet</h3>
              <p className="text-2xl font-bold text-green-600">{stats?.accuracy || 0}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Rätta svar</h3>
              <p className="text-2xl font-bold text-purple-600">{stats?.correctAnswers || 0}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900">Förbättring</h3>
              <p className="text-2xl font-bold text-orange-600">
                {insights?.confidenceTrend ? 
                  `+${Math.round((insights.confidenceTrend[insights.confidenceTrend.length - 1] - insights.confidenceTrend[0]) * 100)}%` 
                  : '0%'
                }
              </p>
            </div>
          </div>

          {/* Inlärningsinsikter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🔍 Vanliga fel</h3>
              <div className="space-y-2">
                {insights?.commonErrors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">📈 Förbättringsområden</h3>
              <div className="space-y-2">
                {insights?.improvementAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prompt-förbättringar */}
          <div className="bg-yellow-50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">🛠️ Föreslagna prompt-förbättringar</h3>
            <div className="space-y-4">
              {generatePromptImprovements().map((improvement, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{improvement.type}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      improvement.impact === 'Hög' ? 'bg-red-100 text-red-800' :
                      improvement.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {improvement.impact} prioritet
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Nuvarande:</strong> {improvement.current}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Förbättring:</strong> {improvement.improvement}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Noggrannhet per leverantör */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">📊 Noggrannhet per leverantör</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {insights?.accuracyByProvider && Object.entries(insights.accuracyByProvider).map(([provider, accuracy]) => (
                <div key={provider} className="bg-white p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-gray-700">{provider}</h4>
                  <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Konfidensutveckling */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">📈 Konfidensutveckling över tid</h3>
            <div className="flex items-end gap-2 h-32">
              {insights?.confidenceTrend.map((confidence, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="bg-blue-500 rounded-t w-full"
                    style={{ height: `${confidence * 100}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Visar AI:ns konfidensnivå över de senaste träningssessionerna
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
