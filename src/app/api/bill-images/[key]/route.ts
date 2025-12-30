import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

// GET - Hämta bild från Cloudflare R2 eller Supabase
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: "Bildnyckel saknas" },
        { status: 400 }
      );
    }

    // Försök först med R2 (Cloudflare)
    let env: any = {};
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    if (!env.BILL_IMAGES && (process.env as any).BILL_IMAGES) {
      env.BILL_IMAGES = (process.env as any).BILL_IMAGES;
    }
    if (!env.BILL_IMAGES && (globalThis as any).env?.BILL_IMAGES) {
      env.BILL_IMAGES = (globalThis as any).env.BILL_IMAGES;
    }

    if (env.BILL_IMAGES) {
      try {
        const object = await env.BILL_IMAGES.get(key);
        if (object) {
          const arrayBuffer = await object.arrayBuffer();
          const contentType = object.httpMetadata?.contentType || 'image/jpeg';
          
          // Konvertera till base64 data URL
          // I Edge runtime kan vi inte använda Buffer direkt, så vi använder btoa
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64 = btoa(binary);
          const dataUrl = `data:${contentType};base64,${base64}`;

          return NextResponse.json({
            success: true,
            url: dataUrl
          });
        }
      } catch (r2Error) {
        console.warn("[bill-images] R2 error, trying Supabase:", r2Error);
      }
    }

    // Fallback till Supabase om R2 inte fungerar
    const supabaseUrl = 
      (globalThis as any).getRequestContext?.()?.env?.SUPABASE_URL ||
      (globalThis as any).env?.SUPABASE_URL ||
      (process.env as any).SUPABASE_URL;
    
    const supabaseKey = 
      (globalThis as any).getRequestContext?.()?.env?.SUPABASE_SERVICE_KEY ||
      (globalThis as any).env?.SUPABASE_SERVICE_KEY ||
      (process.env as any).SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });

        const bucket = "bill_images";
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(key, 3600);

        if (!error && data?.signedUrl) {
          return NextResponse.json({
            success: true,
            url: data.signedUrl
          });
        }
      } catch (supabaseError) {
        console.error("[bill-images] Supabase error:", supabaseError);
      }
    }

    return NextResponse.json(
      { success: false, error: "Bild hittades inte i R2 eller Supabase" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[bill-images] GET error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta bild-URL", details: errorMessage },
      { status: 500 }
    );
  }
}

