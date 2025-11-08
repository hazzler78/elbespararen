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
  storage: "r2" | "local";
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

async function saveToLocalFilesystem(arrayBuffer: ArrayBuffer, key: string, contentType: string) {
  const path = await (async () => {
    const { join } = await import("path");
    const { mkdir } = await import("fs/promises");
    const uploadsDir = join(process.cwd(), "data", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    return join(uploadsDir, key.replace(/\//g, "_"));
  })();

  const { writeFile } = await import("fs/promises");
  await writeFile(path, new Uint8Array(arrayBuffer));

  return {
    path,
    url: undefined as string | undefined,
  };
}

async function saveToR2(arrayBuffer: ArrayBuffer, key: string, contentType: string, metadata?: BillImageMetadata) {
  let env: any = {};

  if (typeof (globalThis as any).getRequestContext === "function") {
    env = (globalThis as any).getRequestContext()?.env ?? {};
  }

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

  const isDevelopment = typeof process !== "undefined" && process.env.NODE_ENV === "development";

  if (isDevelopment) {
    const { url } = await saveToLocalFilesystem(arrayBuffer, key, contentType);
    return {
      key,
      storage: "local",
      url,
      bytes,
      contentType,
      uploadedAt: new Date().toISOString(),
      arrayBuffer,
    };
  }

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
}


