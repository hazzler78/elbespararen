import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for ELbasen (shared Elchef/Elbespararen Supabase).
 * Reads SUPABASE_URL + SUPABASE_SERVICE_KEY from CF Pages env / process.env.
 */
export function getRuntimeEnv(name: string): string | undefined {
  try {
    if (typeof (globalThis as any).getRequestContext === "function") {
      const value = (globalThis as any).getRequestContext()?.env?.[name];
      if (typeof value === "string" && value.length > 0) return value;
    }
  } catch {}

  try {
    const value = (globalThis as any)?.env?.[name];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {}

  try {
    const value = (process.env as any)?.[name];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {}

  return undefined;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getRuntimeEnv("SUPABASE_URL") || getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getRuntimeEnv("SUPABASE_SERVICE_KEY");
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "elbespararen-admin" } },
  });
}

export const ELBESPAREN_SOURCE = "elbespararen";
