"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, CheckCircle2, XCircle, Loader2, User } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

export default function SetPremiumAdminPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState("mickes@hotmail.se");
  const [tier, setTier] = useState<'free' | 'premium'>('premium');

  const setPremium = async () => {
    if (!email) {
      setResult({ success: false, error: "Ange en e-postadress" });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await fetchWithAuth('/api/admin/set-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tier }),
      }, session);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error setting premium:", error);
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Du måste vara inloggad för att använda denna sida</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Sätt Premium-status</h1>
          </div>

          {/* Current User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-2">Inloggad som:</h2>
            <div className="flex items-center gap-2">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || session.user.email || "User"}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {session.user?.name || session.user?.email}
                </p>
                <p className="text-xs text-gray-500">{session.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-postadress
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mickes@hotmail.se"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ange e-postadressen för användaren du vill uppdatera
              </p>
            </div>

            <div>
              <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as 'free' | 'premium')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <button
              onClick={setPremium}
              disabled={loading || !email}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                tier === 'premium'
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-500 hover:to-yellow-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uppdaterar...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Sätt till {tier === 'premium' ? 'Premium' : 'Free'}
                </>
              )}
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
                      <p>E-post: {result.data.email}</p>
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
            <h3 className="font-semibold text-gray-900 mb-2">Instruktioner:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Ange e-postadressen för användaren (t.ex. mickes@hotmail.se)</li>
              <li>Välj "Premium" eller "Free"</li>
              <li>Klicka på knappen för att uppdatera status</li>
              <li>Gå till <a href="/dashboard" className="text-primary hover:underline">Dashboard</a> för att se ändringarna</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
