import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export function getEnvVar(key: string): string | undefined {
  const fromProcess = (process.env as Record<string, string | undefined>)?.[key];
  if (typeof fromProcess === "string" && fromProcess.length > 0) return fromProcess;

  try {
    const ctxEnv = (globalThis as any).getRequestContext?.()?.env;
    if (ctxEnv && typeof ctxEnv[key] === "string" && ctxEnv[key]) {
      return ctxEnv[key] as string;
    }
  } catch {
    // ignore
  }

  try {
    const workerEnv = (globalThis as any).env;
    if (workerEnv && typeof workerEnv[key] === "string" && workerEnv[key]) {
      return workerEnv[key] as string;
    }
  } catch {
    // ignore
  }

  return undefined;
}

/** Password checked at login (never ship to client). */
export function getAdminPassword(): string | undefined {
  return getEnvVar("ADMIN_PASSWORD");
}

/** Secret used to sign the admin session cookie. */
export function getAdminSecret(): string | undefined {
  return (
    getEnvVar("ADMIN_SECRET") ||
    getEnvVar("ADMIN_PASSWORD") ||
    getEnvVar("NEXTAUTH_SECRET")
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return toBase64Url(sig);
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i]! ^ bBytes[i]!;
  return diff === 0;
}

export async function createAdminSessionToken(
  secret: string,
  ttlSeconds = SESSION_TTL_SECONDS
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `v1.${exp}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expStr, sig] = parts;
  if (version !== "v1" || !expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const payload = `${version}.${expStr}`;
  const expected = await hmacSign(payload, secret);
  return timingSafeEqual(sig, expected);
}

export async function passwordsMatch(
  provided: string,
  expected: string
): Promise<boolean> {
  return timingSafeEqual(provided, expected);
}

export function adminSessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Returns null if the request is authorized as admin.
 * Otherwise returns a 401/503 JSON response.
 */
export async function requireAdmin(
  req: NextRequest
): Promise<NextResponse | null> {
  const secret = getAdminSecret();
  if (!secret) {
    return NextResponse.json(
      { success: false, error: "Admin not configured" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}` || auth === `Bearer ${getAdminPassword()}`) {
    return null;
  }

  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (await verifyAdminSessionToken(cookie, secret)) {
    return null;
  }

  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}

export async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  const denied = await requireAdmin(req);
  return denied === null;
}
