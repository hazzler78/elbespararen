"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function TestPremiumPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user/info', {
        credentials: 'include', // Important: include cookies
      });
      const data = await response.json();
      if (data.success) {
        setUserInfo(data.data);
      } else {
        console.error("Failed to fetch user info:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const setPremium = async (tier: 'free' | 'premium') => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/set-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ tier }),
      });
      const data = await response.json();
      setResult(data);
      if (data.success) {
        // Refresh user info
        await fetchUserInfo();
      }
    } catch (error) {
      console.error("Error setting premium:", error);
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user info on mount
  useEffect(() => {
    if (session) {
      fetchUserInfo();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Du måste vara inloggad för att testa premium</p>
          <a
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Logga in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Test Premium-funktioner</h1>
          </div>

          {/* Current User Info */}
          {userInfo && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-2">Din nuvarande status:</h2>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Email:</span> {userInfo.email}</p>
                <p>
                  <span className="font-medium">Tier:</span>{' '}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    userInfo.tier === 'premium' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userInfo.tier}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Premium:</span>{' '}
                  {userInfo.isPremium ? (
                    <span className="text-green-600 font-medium">Ja ✓</span>
                  ) : (
                    <span className="text-gray-600">Nej</span>
                  )}
                </p>
                {userInfo.subscriptionExpiresAt && (
                  <p>
                    <span className="font-medium">Giltig till:</span>{' '}
                    {new Date(userInfo.subscriptionExpiresAt).toLocaleDateString('sv-SE')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Åtgärder:</h2>
            
            <div className="flex gap-4">
              <button
                onClick={() => setPremium('premium')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-lg hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uppdaterar...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Sätt till Premium
                  </>
                )}
              </button>

              <button
                onClick={() => setPremium('free')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uppdaterar...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Sätt till Free
                  </>
                )}
              </button>
            </div>

            <button
              onClick={fetchUserInfo}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Uppdatera status
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className={`mt-6 p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.message || result.error}
                  </p>
                  {result.data && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Tier: {result.data.tier}</p>
                      {result.data.expiresAt && (
                        <p>Giltig till: {new Date(result.data.expiresAt).toLocaleDateString('sv-SE')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Nästa steg:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Klicka på "Sätt till Premium" för att aktivera premium</li>
              <li>Gå till <a href="/dashboard" className="text-primary hover:underline">Dashboard</a> för att se premium-funktioner</li>
              <li>Testa export-funktioner och andra premium-features</li>
              <li>Använd "Sätt till Free" för att återställa</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
