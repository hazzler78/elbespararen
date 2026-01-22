"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, AlertCircle, Loader2, Zap } from "lucide-react";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Behåll pendingAnalysis i callbackUrl om den finns
      const finalCallbackUrl = callbackUrl.includes('pendingAnalysis') 
        ? callbackUrl 
        : `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}pendingAnalysis=1`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(finalCallbackUrl)}`,
        },
      });
      if (error) {
        setError(error.message);
        setIsGoogleLoading(false);
      }
      // Note: User will be redirected, so we don't need to handle success here
    } catch (err) {
      setError('Ett oväntat fel uppstod. Försök igen.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Alla fält är obligatoriska');
      return;
    }

    if (formData.password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    setIsLoading(true);

    try {
      // Register user with Supabase
      // Behåll pendingAnalysis i callbackUrl om den finns
      const finalCallbackUrl = callbackUrl.includes('pendingAnalysis') 
        ? callbackUrl 
        : `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}pendingAnalysis=1`;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            name: formData.name,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(finalCallbackUrl)}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Kunde inte skapa konto');
        setIsLoading(false);
        return;
      }

      // Also create user in our database for consistency
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();
        if (!response.ok && !data.error?.includes('finns redan')) {
          console.warn('[Register] Could not create user in database:', data.error);
          // Don't fail registration if database save fails
        }
      } catch (dbError) {
        console.warn('[Register] Database save error (non-critical):', dbError);
        // Don't fail registration if database save fails
      }

      // Check if email confirmation is required
      if (signUpData.user && !signUpData.session) {
        // Email confirmation required
        setError('Kontrollera din e-post för att bekräfta ditt konto innan du loggar in.');
        setIsLoading(false);
        return;
      }

      // If we have a session, user is automatically logged in
      if (signUpData.session) {
        // Redirect to callback URL
        router.push(callbackUrl);
        router.refresh();
      } else {
        // Should not happen, but handle it
        setError('Konto skapat men kunde inte logga in. Kontrollera din e-post för bekräftelse.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Ett oväntat fel uppstod. Försök igen.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Skapa konto
            </h1>
            <p className="text-gray-600">
              Börja spara pengar på din elräkning idag
            </p>
          </div>

          {!showEmailForm ? (
            <>
              {/* Google Sign Up Button */}
              <button
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-gray-700 font-medium">
                      Fortsätt med Google
                    </span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">eller</span>
                </div>
              </div>

              {/* Email/Password Sign Up Button */}
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">
                  Skapa konto med e-post
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailForm(false);
                      setError(null);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Tillbaka
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Namn
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Ditt namn"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-postadress
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="din@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Lösenord
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Minst 8 tecken"
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Bekräfta lösenord
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Bekräfta lösenordet"
                        minLength={8}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Skapar konto...
                    </>
                  ) : (
                    'Skapa konto'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Har du redan ett konto?{' '}
            <Link href={`/auth/signin${callbackUrl !== '/dashboard' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="font-medium text-primary hover:text-primary/80">
              Logga in här
            </Link>
          </p>

          {/* Info */}
          <p className="mt-6 text-xs text-center text-gray-500">
            Genom att skapa konto godkänner du våra{" "}
            <a href="/terms" className="text-primary hover:underline">
              användarvillkor
            </a>{" "}
            och{" "}
            <a href="/privacy" className="text-primary hover:underline">
              integritetspolicy
            </a>
            .
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">Med konto kan du:</p>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>✓ Spara alla dina fakturaanalyser</li>
            <li>✓ Följa trender och besparingar över tid</li>
            <li>✓ Jämföra med andra i ditt område</li>
            <li>✓ Få proaktiva varningar om bättre avtal</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
