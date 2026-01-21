import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return supabaseResponse
}
