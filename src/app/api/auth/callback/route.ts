import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next') || '/dashboard'

  // If user came from upload page with pending analysis, redirect back to upload
  // The upload page will check for pendingAnalysis in sessionStorage and show results
  if (next === '/auth/register' || next === '/premium') {
    // Check if there's a pending analysis (stored in referer or we can check sessionStorage client-side)
    // For now, redirect to upload if they came from register/premium
    // The upload page will handle showing the analysis result
    const referer = request.headers.get('referer');
    if (referer?.includes('/upload')) {
      next = '/upload';
    }
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/signin?error=Missing authorization code', request.url))
  }

  try {
    // Helper function to get environment variable
    function getEnvVar(key: string): string | undefined {
      const fromProcess = (process.env as any)?.[key];
      if (typeof fromProcess === "string" && fromProcess.length > 0) return fromProcess;
      
      try {
        const ctxEnv = (globalThis as any).getRequestContext?.()?.env;
        if (ctxEnv && typeof ctxEnv[key] === "string" && ctxEnv[key]) {
          return ctxEnv[key] as string;
        }
      } catch (e) {}
      
      try {
        const workerEnv = (globalThis as any).env;
        if (workerEnv && typeof workerEnv[key] === "string" && workerEnv[key]) {
          return workerEnv[key] as string;
        }
      } catch (e) {}
      
      return undefined;
    }

    const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
    const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[auth/callback] Missing Supabase environment variables');
      return NextResponse.redirect(new URL('/auth/signin?error=Configuration error', request.url))
    }

    // Create response first so we can set cookies on it
    const response = NextResponse.redirect(new URL(next, request.url))

    // Create Supabase client with cookie handlers that write to response
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }))
          },
          setAll(cookiesToSet) {
            // Set cookies on the response object for Edge runtime
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[auth/callback] Error exchanging code:', error)
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url))
    }

    if (!data?.session) {
      console.error('[auth/callback] No session returned')
      return NextResponse.redirect(new URL('/auth/signin?error=Failed to create session', request.url))
    }

    // Cookies are already set by setAll callback above
    console.log('[auth/callback] Session created successfully for user:', data.session.user.email)
    return response
  } catch (error) {
    console.error('[auth/callback] Exception:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
