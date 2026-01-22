"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check if we have a valid reset token in the URL hash
    const checkToken = async () => {
      // First, check if there's a hash fragment with tokens (password reset flow)
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const hasResetToken = hash && (hash.includes('access_token') || hash.includes('type=recovery'));
        
        if (hasResetToken) {
          // Token exists in hash - Supabase will process it automatically
          // Wait for Supabase to process the hash and create a session
          const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (mounted) {
              if (session) {
                setIsValidToken(true);
              } else if (error) {
                console.error('[ResetPassword] Error processing token:', error);
                setIsValidToken(false);
              } else {
                // No session yet, wait a bit more
                setTimeout(checkSession, 500);
              }
            }
          };

          // Initial check
          setTimeout(checkSession, 100);
          return;
        }
      }

      // No hash fragment - check if we already have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setIsValidToken(!!session);
      }
    };

    // Listen for auth state changes (when token is processed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setIsValidToken(true);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setIsValidToken(true);
        }
      }
    });

    checkToken();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password || !confirmPassword) {
      setError('Alla fält är obligatoriska');
      return;
    }

    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken');
      return;
    }

    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message || 'Kunde inte återställa lösenord');
        setIsLoading(false);
        return;
      }

      // Success - show success message and redirect
      setSuccess(true);
      setIsLoading(false);
      
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin?passwordReset=success');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Ett oväntat fel uppstod. Försök igen.');
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Ogiltig eller utgången länk
              </h1>
              <p className="text-gray-600 mb-6">
                Återställningslänken är ogiltig eller har gått ut. Var vänlig begär en ny länk.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Begär ny länk
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Återställ lösenord
            </h1>
            <p className="text-gray-600">
              Ange ditt nya lösenord
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Lösenord återställt!</p>
                  <p className="text-sm mt-1">
                    Ditt lösenord har återställts. Du omdirigeras till inloggningssidan...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Nytt lösenord
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Bekräfta lösenordet"
                      minLength={8}
                    />
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
                      Återställer...
                    </>
                  ) : (
                    'Återställ lösenord'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Tillbaka till inloggning
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
