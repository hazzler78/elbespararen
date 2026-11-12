import { createClient } from "@supabase/supabase-js";

export const PROVIDER_LOGO_PREFIX = "provider-logos";
export const MAX_PROVIDER_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

type R2LikeBucket = {
  get?: (key: string) => Promise<{
    arrayBuffer: () => Promise<ArrayBuffer>;
    httpMetadata?: { contentType?: string };
  } | null>;
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | Blob | string,
    options?: unknown
  ) => Promise<unknown>;
};

export type ProviderLogoEnv = {
  BILL_IMAGES?: R2LikeBucket;
};

export type SaveProviderLogoResult = {
  key: string;
  logoUrl: string;
  storage: "r2" | "supabase";
  bytes: number;
  contentType: string;
};

function getRuntimeEnv(name: string): string | undefined {
  try {
    if (typeof (globalThis as any).getRequestContext === "function") {
      const value = (globalThis as any).getRequestContext()?.env?.[name];
      if (typeof value === "string" && value.length > 0) return value;
    }
  } catch {
    // ignore
  }
  try {
    const value = (globalThis as any)?.env?.[name];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {
    // ignore
  }
  try {
    const value = (process.env as any)?.[name];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {
    // ignore
  }
  return undefined;
}

async function resolveR2Binding(
  explicitEnv?: ProviderLogoEnv | null
): Promise<ProviderLogoEnv | undefined> {
  if (explicitEnv?.BILL_IMAGES) return explicitEnv;

  if (typeof (globalThis as any).getRequestContext === "function") {
    const ctxEnv = (globalThis as any).getRequestContext()?.env;
    if (ctxEnv?.BILL_IMAGES) return ctxEnv;
  }

  const globalEnv = (globalThis as any)?.env as ProviderLogoEnv | undefined;
  if (globalEnv?.BILL_IMAGES) return globalEnv;

  return undefined;
}

function inferExtension(file: File): string | null {
  const fromMime: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  if (fromMime[file.type]) return fromMime[file.type]!;

  const parts = file.name.split(".");
  if (parts.length > 1) {
    const ext = (parts.pop() || "").toLowerCase();
    if (ext in MIME_BY_EXT) return ext;
  }
  return null;
}

export function validateProviderLogoFile(file: File): string | null {
  if (!file || file.size === 0) {
    return "Filen är tom.";
  }
  if (file.size > MAX_PROVIDER_LOGO_BYTES) {
    return `Filen är för stor (max ${Math.round(MAX_PROVIDER_LOGO_BYTES / (1024 * 1024))} MB).`;
  }

  const ext = inferExtension(file);
  if (!ext) {
    return "Ogiltigt filformat. Tillåtna format: PNG, JPG, WebP, SVG.";
  }

  const mime = file.type || MIME_BY_EXT[ext];
  if (mime && !ALLOWED_MIME.has(mime)) {
    return "Ogiltigt filformat. Tillåtna format: PNG, JPG, WebP, SVG.";
  }

  return null;
}

export function sanitizeProviderId(providerId: string): string {
  return (providerId || "provider")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

export function buildProviderLogoObjectKey(providerId: string, file: File): string {
  const ext = inferExtension(file);
  if (!ext) {
    throw new Error("Ogiltigt filformat");
  }
  const safeId = sanitizeProviderId(providerId);
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${PROVIDER_LOGO_PREFIX}/${safeId}-${random}.${ext}`;
}

/** Public path stored in `logo_url` and used in `<img src>`. */
export function providerLogoPublicUrl(objectKey: string): string {
  return `/api/provider-logos/${encodeURIComponent(objectKey)}`;
}

export function isProviderLogoObjectKey(key: string): boolean {
  return key.startsWith(`${PROVIDER_LOGO_PREFIX}/`);
}

async function saveToR2(
  arrayBuffer: ArrayBuffer,
  key: string,
  contentType: string,
  envOverride?: ProviderLogoEnv
) {
  const env = await resolveR2Binding(envOverride);
  if (!env?.BILL_IMAGES?.put) {
    throw new Error("R2 binding saknas");
  }

  await env.BILL_IMAGES.put(key, arrayBuffer, {
    httpMetadata: { contentType },
  });
}

async function saveToSupabase(
  arrayBuffer: ArrayBuffer,
  key: string,
  contentType: string
) {
  const supabaseUrl = getRuntimeEnv("SUPABASE_URL");
  const supabaseKey = getRuntimeEnv("SUPABASE_SERVICE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials missing");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const bucket = "bill_images";
  const { error } = await supabase.storage.from(bucket).upload(key, arrayBuffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

export async function saveProviderLogo(
  file: File,
  providerId: string,
  options?: { env?: ProviderLogoEnv }
): Promise<SaveProviderLogoResult> {
  const validationError = validateProviderLogoFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const arrayBuffer = await file.arrayBuffer();
  const ext = inferExtension(file)!;
  const contentType = file.type || MIME_BY_EXT[ext] || "application/octet-stream";
  const key = buildProviderLogoObjectKey(providerId, file);

  try {
    await saveToR2(arrayBuffer, key, contentType, options?.env);
    return {
      key,
      logoUrl: providerLogoPublicUrl(key),
      storage: "r2",
      bytes: arrayBuffer.byteLength,
      contentType,
    };
  } catch (r2Error) {
    console.warn("[provider-logos] R2 upload failed, trying Supabase:", r2Error);
    await saveToSupabase(arrayBuffer, key, contentType);
    return {
      key,
      logoUrl: providerLogoPublicUrl(key),
      storage: "supabase",
      bytes: arrayBuffer.byteLength,
      contentType,
    };
  }
}

export async function getProviderLogoObject(
  key: string,
  envOverride?: ProviderLogoEnv
): Promise<{ arrayBuffer: ArrayBuffer; contentType: string } | null> {
  if (!isProviderLogoObjectKey(key)) {
    return null;
  }

  const env = await resolveR2Binding(envOverride);
  if (env?.BILL_IMAGES?.get) {
    try {
      const object = await env.BILL_IMAGES.get(key);
      if (object) {
        const arrayBuffer = await object.arrayBuffer();
        const contentType =
          object.httpMetadata?.contentType || "application/octet-stream";
        return { arrayBuffer, contentType };
      }
    } catch (error) {
      console.warn("[provider-logos] R2 get error:", error);
    }
  }

  const supabaseUrl = getRuntimeEnv("SUPABASE_URL");
  const supabaseKey = getRuntimeEnv("SUPABASE_SERVICE_KEY");
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.storage.from("bill_images").download(key);
    if (!error && data) {
      const arrayBuffer = await data.arrayBuffer();
      const contentType = data.type || "application/octet-stream";
      return { arrayBuffer, contentType };
    }
  }

  return null;
}
