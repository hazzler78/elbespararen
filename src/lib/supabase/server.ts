import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// Helper function to get environment variable (works in both Node and Edge runtime)
function getEnvVar(key: string): string | undefined {
  // Try process.env first (works in both Node and Edge runtime)
  const fromProcess = (process.env as any)?.[key];
  if (typeof fromProcess === "string" && fromProcess.length > 0) return fromProcess;
  
  // Try getRequestContext (next-on-pages for Cloudflare Pages)
  try {
    const ctxEnv = (globalThis as any).getRequestContext?.()?.env;
    if (ctxEnv && typeof ctxEnv[key] === "string" && ctxEnv[key]) {
      return ctxEnv[key] as string;
    }
  } catch (e) {
    // getRequestContext might not be available or might throw
  }
  
  // Try globalThis.env (Cloudflare Workers)
  try {
    const workerEnv = (globalThis as any).env;
    if (workerEnv && typeof workerEnv[key] === "string" && workerEnv[key]) {
      return workerEnv[key] as string;
    }
  } catch (e) {
    // globalThis.env might not be available
  }
  
  return undefined;
}

export function createClient() {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies().set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// For Edge runtime (Cloudflare Pages)
// Note: This function doesn't handle cookie setting - that's done in the route handlers
export function createClientForRequest(req: NextRequest) {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll(cookiesToSet) {
          // Cookies will be set manually in route handlers for Edge runtime
          // This is a limitation of Edge runtime - we can't modify cookies here
        },
      },
    }
  )
}
