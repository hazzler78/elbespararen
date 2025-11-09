// Helper för att spara uppladdade elfakturor i Cloudflare R2 (produktion)
// och lokalt filsystem (utveckling).
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
  storage: "r2" | "skipped";
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
let cachedCloudflareImport: BillImageEnv | null | undefined;

async function resolveR2Binding(explicitEnv?: BillImageEnv): Promise<BillImageEnv | undefined> {
  if (explicitEnv?.BILL_IMAGES) {
    console.log("[bill-images] Found BILL_IMAGES via explicit env override");
    return explicitEnv;
  }

  const globalEnv = (globalThis as any)?.env;
  if (globalEnv?.BILL_IMAGES) {
    console.log("[bill-images] Found BILL_IMAGES via globalThis.env");
    return globalEnv;
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

  if (!cachedCloudflareImport) {
    try {
      const cloudflareModule = await import("cloudflare:env");
      cachedCloudflareImport = cloudflareModule?.env as BillImageEnv;
      if (cachedCloudflareImport?.BILL_IMAGES) {
        console.log("[bill-images] Found BILL_IMAGES via cloudflare:env import");
        return cachedCloudflareImport;
      }
    } catch (error) {
      // cloudflare:env finns bara i Workers-miljö – ignorera när vi kör lokalt
      cachedCloudflareImport = null;
      console.debug("[bill-images] cloudflare:env import failed (likely local dev environment)", error);
    }
  } else if (cachedCloudflareImport?.BILL_IMAGES) {
    return cachedCloudflareImport;
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
  } catch (error) {
    console.warn("[bill-images] Kunde inte spara till R2 - fortsätter utan bildlagring:", error);

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


