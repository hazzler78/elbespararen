import { createClient } from "@supabase/supabase-js";

// Helper för att spara uppladdade elfakturor i Supabase Storage (produktion)
// och lokalt filsystem (utveckling). Behåller R2 som fallback om Supabase
// saknas eller felar.
//
// Designmål:
// - Återanvänd ArrayBuffer för vidare bearbetning (t.ex. OpenAI Vision)
// - Spara rik metadata för enklare framtida modellträning
// - Inte bryta Edge-runtime genom att importera Node-moduler i produktion

type BillImageMetadata = {
  postalCode?: string;
  priceArea?: string;
};

export type SaveBillImageResult = {
  key: string;
  url?: string;
  storage: "supabase" | "r2" | "skipped";
  bytes: number;
  contentType: string;
  uploadedAt: string;
  arrayBuffer: ArrayBuffer;
};

type R2LikeBucket = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | Blob | string,
    options?: unknown
  ) => Promise<unknown>;
};

type BillImageEnv = {
  BILL_IMAGES?: R2LikeBucket;
};

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function inferExtension(file: File): string {
  const fromMime = EXTENSION_BY_MIME[file.type];
  if (fromMime) {
    return fromMime;
  }

  const nameParts = file.name.split(".");
  if (nameParts.length > 1) {
    return nameParts.pop() as string;
  }

  return "bin";
}

function buildObjectKey(file: File): string {
  const now = new Date();
  const datePrefix = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const extension = inferExtension(file);
  const random = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `bill-uploads/${datePrefix}/${random}.${extension}`;
}

let hasLoggedMissingBinding = false;
let hasLoggedEnvKeys = false;
let hasLoggedCloudflareImportWarning = false;
let hasLoggedCloudflareImportSuccess = false;
let cloudflareEnvPromise: Promise<BillImageEnv | undefined> | null = null;
let hasLoggedMissingSupabaseConfig = false;
let hasLoggedSupabaseSuccess = false;

async function loadCloudflareEnv(): Promise<BillImageEnv | undefined> {
  if (!cloudflareEnvPromise) {
    cloudflareEnvPromise = (async () => {
      try {
        // Some runtimes expose bindings via a virtual module `cloudflare:env`,
        // but importing it directly breaks the Next.js build step.
        // If the module is unavailable we just fall back to the other strategies.
        if (!hasLoggedCloudflareImportWarning) {
          hasLoggedCloudflareImportWarning = true;
          console.debug("[bill-images] cloudflare:env import skipped (not supported in this build environment)");
        }
        return undefined;
      } catch (error) {
        if (!hasLoggedCloudflareImportWarning) {
          hasLoggedCloudflareImportWarning = true;
          const message = error instanceof Error ? error.message : String(error);
          console.debug("[bill-images] cloudflare:env import unavailable:", message);
        }
        return undefined;
      }
    })();
  }
  return cloudflareEnvPromise;
}

async function resolveR2Binding(explicitEnv?: BillImageEnv | null): Promise<BillImageEnv | undefined> {
  if (explicitEnv?.BILL_IMAGES) {
    console.log("[bill-images] Found BILL_IMAGES via explicit env override");
    return explicitEnv;
  }

  const importedEnv = await loadCloudflareEnv();
  if (importedEnv?.BILL_IMAGES) {
    return importedEnv;
  }

  const globalEnv = ((globalThis as any)?.env ??
    (globalThis as any)?.CF_PAGES?.env) as BillImageEnv | undefined;
  if (globalEnv?.BILL_IMAGES) {
    console.log("[bill-images] Found BILL_IMAGES via globalThis.env");
    return globalEnv;
  }
  if (globalEnv && !hasLoggedEnvKeys) {
    hasLoggedEnvKeys = true;
    console.log("[bill-images] global env keys", Object.keys(globalEnv));
  }

  if (typeof (globalThis as any).getRequestContext === "function") {
    const ctxEnv = (globalThis as any).getRequestContext()?.env;
    if (ctxEnv?.BILL_IMAGES) {
      console.log("[bill-images] Found BILL_IMAGES via getRequestContext().env");
      return ctxEnv;
    }

    if (!hasLoggedMissingBinding && ctxEnv) {
      hasLoggedMissingBinding = true;
      const availableKeys = Object.keys(ctxEnv);
      console.warn("[bill-images] BILL_IMAGES binding missing in getRequestContext().env. Available keys:", availableKeys);
    }
  }

  if (!hasLoggedMissingBinding) {
    hasLoggedMissingBinding = true;
    const availableKeys = globalEnv ? Object.keys(globalEnv) : [];
    console.warn("[bill-images] BILL_IMAGES binding not found in available contexts. Available keys:", availableKeys);
  }

  return undefined;
}

async function saveToR2(
  arrayBuffer: ArrayBuffer,
  key: string,
  contentType: string,
  metadata?: BillImageMetadata,
  envOverride?: BillImageEnv
) {
  const env = await resolveR2Binding(envOverride);
  if (!env?.BILL_IMAGES) {
    throw new Error("[bill-images] R2 binding BILL_IMAGES saknas i runtime");
  }

  console.log("[bill-images] Using BILL_IMAGES binding to store object", {
    key,
    hasPut: typeof env.BILL_IMAGES?.put === "function"
  });

  const uploadedAt = new Date().toISOString();

  await env.BILL_IMAGES.put(key, arrayBuffer, {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      uploadedAt,
      ...(metadata?.postalCode ? { postalCode: metadata.postalCode } : {}),
      ...(metadata?.priceArea ? { priceArea: metadata.priceArea } : {}),
    },
  });

  // Offentliga URL:er kräver separat konfiguration (t.ex. R2 custom domain).
  // Returnera undefined tills det finns en publik URL.
  return {
    url: undefined as string | undefined,
    uploadedAt,
  };
}

function getRuntimeEnv(name: string): string | undefined {
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
    const value = (globalThis as any)?.CF_PAGES?.env?.[name];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {}

  try {
    const value = (process.env as any)?.[name];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {}

  return undefined;
}

async function saveToSupabase(
  arrayBuffer: ArrayBuffer,
  key: string,
  contentType: string,
  metadata?: BillImageMetadata
) {
  const supabaseUrl = getRuntimeEnv("SUPABASE_URL");
  const supabaseKey = getRuntimeEnv("SUPABASE_SERVICE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    if (!hasLoggedMissingSupabaseConfig) {
      hasLoggedMissingSupabaseConfig = true;
      console.warn(
        "[bill-images] Supabase-konfiguration saknas (SUPABASE_URL eller SUPABASE_SERVICE_KEY)."
      );
    }
    throw new Error("Supabase credentials missing");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "elbespararen-bill-images" } },
  });

  const bucket = "bill_images";
  const uploadedAt = new Date().toISOString();

  const { error } = await supabase.storage.from(bucket).upload(key, arrayBuffer, {
    contentType,
    metadata: {
      uploadedAt,
      ...(metadata?.postalCode ? { postalCode: metadata.postalCode } : {}),
      ...(metadata?.priceArea ? { priceArea: metadata.priceArea } : {}),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!hasLoggedSupabaseSuccess) {
    hasLoggedSupabaseSuccess = true;
    console.log("[bill-images] Lagrar bilder i Supabase bucket:", bucket);
  }

  return {
    url: undefined as string | undefined,
    uploadedAt,
  };
}

export async function saveBillImage(
  file: File,
  metadata?: BillImageMetadata,
  options?: { env?: BillImageEnv }
): Promise<SaveBillImageResult> {
  const arrayBuffer = await file.arrayBuffer();
  const contentType = file.type || "application/octet-stream";
  const key = buildObjectKey(file);
  const bytes = arrayBuffer.byteLength;

  try {
    const { url, uploadedAt } = await saveToSupabase(arrayBuffer, key, contentType, metadata);

    return {
      key,
      storage: "supabase",
      url,
      bytes,
      contentType,
      uploadedAt,
      arrayBuffer,
    };
  } catch (error) {
    console.warn("[bill-images] Kunde inte spara till Supabase - försöker R2:", error);

    try {
      const { url, uploadedAt } = await saveToR2(arrayBuffer, key, contentType, metadata, options?.env);

      return {
        key,
        storage: "r2",
        url,
        bytes,
        contentType,
        uploadedAt,
        arrayBuffer,
      };
    } catch (r2Error) {
      console.warn("[bill-images] Kunde inte spara till R2 - fortsätter utan bildlagring:", r2Error);

      return {
        key,
        storage: "skipped",
        url: undefined,
        bytes,
        contentType,
        uploadedAt: new Date().toISOString(),
        arrayBuffer,
      };
    }
  }
}


