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

function resolveR2Binding(): any | undefined {
  const globalEnv = (globalThis as any)?.env;
  if (globalEnv?.BILL_IMAGES) {
    return globalEnv;
  }

  if (typeof (globalThis as any).getRequestContext === "function") {
    const ctxEnv = (globalThis as any).getRequestContext()?.env;
    if (ctxEnv?.BILL_IMAGES) {
      return ctxEnv;
    }
  }

  return undefined;
}

async function saveToR2(arrayBuffer: ArrayBuffer, key: string, contentType: string, metadata?: BillImageMetadata) {
  const env = resolveR2Binding();
  if (!env?.BILL_IMAGES) {
    throw new Error("[bill-images] R2 binding BILL_IMAGES saknas i runtime");
  }

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

export async function saveBillImage(file: File, metadata?: BillImageMetadata): Promise<SaveBillImageResult> {
  const arrayBuffer = await file.arrayBuffer();
  const contentType = file.type || "application/octet-stream";
  const key = buildObjectKey(file);
  const bytes = arrayBuffer.byteLength;

  try {
    const { url, uploadedAt } = await saveToR2(arrayBuffer, key, contentType, metadata);

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


