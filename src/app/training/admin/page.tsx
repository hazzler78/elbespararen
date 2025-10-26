'use client';

import { useState, useEffect } from 'react';
import { exportTrainingData, importTrainingData, clearTrainingData, getDatabaseStats } from '@/lib/server-database';
import { getTrainingStats } from '@/lib/ai-training';

export default function TrainingAdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Ladda statistik från API
      const response = await fetch('/api/training/feedback');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setDbStats({
          totalExamples: data.stats.totalInvoices,
          totalPromptVersions: 0, // TODO: Lägg till i API
          storageSize: 0, // TODO: Lägg till i API
          lastUpdated: data.stats.recentFeedback?.[0]?.timestamp || null
        });
      }
    } catch (error) {
      console.error('Fel vid laddning av statistik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/training/export');
      const data = await response.json();
      
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elbespararen-training-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('Fel vid export: ' + data.error);
      }
    } catch (error) {
      alert('Fel vid export: ' + error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        const response = await fetch('/api/training/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Träningsdata importerad!');
          loadStats();
        } else {
          alert('Fel vid import: ' + result.error);
        }
      } catch (error) {
        alert('Fel vid import: ' + error);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = async () => {
    if (confirm('Är du säker på att du vill rensa all träningsdata? Detta går inte att ångra!')) {
      try {
        const response = await fetch('/api/training/clear', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
          alert('All träningsdata rensad!');
          loadStats();
        } else {
          alert('Fel vid rensning: ' + result.error);
        }
      } catch (error) {
        alert('Fel vid rensning: ' + error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar admin-data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔧 AI-träningsadmin
          </h1>
          
          {/* Databasstatistik */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Träningsexempel</h3>
              <p className="text-2xl font-bold text-blue-600">{dbStats?.totalExamples || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Prompt-versioner</h3>
              <p className="text-2xl font-bold text-green-600">{dbStats?.totalPromptVersions || 0}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Lagringsstorlek</h3>
              <p className="text-sm font-bold text-purple-600">
                {dbStats?.storageSize ? `${Math.round(dbStats.storageSize / 1024)} KB` : '0 KB'}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900">Senast uppdaterad</h3>
              <p className="text-sm text-orange-600">
                {dbStats?.lastUpdated ? 
                  new Date(dbStats.lastUpdated).toLocaleString() : 
                  'Aldrig'
                }
              </p>
            </div>
          </div>

          {/* Träningsstatistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">Total noggrannhet</h3>
              <p className="text-2xl font-bold text-gray-600">{stats?.accuracy || 0}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">Senaste noggrannhet</h3>
              <p className="text-2xl font-bold text-gray-600">{stats?.recentAccuracy || 0}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">Vanliga fel</h3>
              <p className="text-sm text-gray-600">{stats?.commonErrors?.length || 0} identifierade</p>
            </div>
          </div>

          {/* Prompt-versioner */}
          {stats?.promptVersions && stats.promptVersions.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">📝 Prompt-versioner</h3>
              <div className="space-y-3">
                {stats.promptVersions.map((version: any) => (
                  <div key={version.id} className={`p-4 rounded-lg border-l-4 ${
                    version.isActive ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">
                          {version.id} {version.isActive && '(Aktiv)'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Skapad: {new Date(version.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Noggrannhet: {Math.round(version.accuracy * 100)}% ({version.testCount} tester)
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          version.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {version.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aktuell prompt */}
          {stats?.currentPrompt && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">🤖 Aktuell prompt</h3>
              <div className="bg-white p-4 rounded-lg border">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {stats.currentPrompt}
                </pre>
              </div>
            </div>
          )}

          {/* Admin-åtgärder */}
          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">⚙️ Admin-åtgärder</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Exportera data</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Ladda ner all träningsdata som JSON-fil
                </p>
                <button
                  onClick={handleExport}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  📥 Exportera
                </button>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Importera data</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Ladda upp träningsdata från JSON-fil
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Rensa data</h4>
                <p className="text-sm text-gray-600 mb-3">
                  ⚠️ Rensa all träningsdata permanent
                </p>
                <button
                  onClick={handleClear}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  🗑️ Rensa allt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
