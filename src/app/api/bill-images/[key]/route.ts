import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'edge';

// GET - Hämta public URL för fakturabild från Supabase
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

    // Hämta Supabase-credentials från environment
    const supabaseUrl = 
      (globalThis as any).getRequestContext?.()?.env?.SUPABASE_URL ||
      (globalThis as any).env?.SUPABASE_URL ||
      (process.env as any).SUPABASE_URL;
    
    const supabaseKey = 
      (globalThis as any).getRequestContext?.()?.env?.SUPABASE_SERVICE_KEY ||
      (globalThis as any).env?.SUPABASE_SERVICE_KEY ||
      (process.env as any).SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Supabase-konfiguration saknas" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const bucket = "bill_images";
    
    // Hämta signed URL (giltig i 1 timme)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(key, 3600); // 1 timme

    if (error) {
      console.error("[bill-images] Error creating signed URL:", error);
      return NextResponse.json(
        { success: false, error: "Kunde inte hämta bild-URL", details: error.message },
        { status: 500 }
      );
    }

    if (!data?.signedUrl) {
      return NextResponse.json(
        { success: false, error: "Ingen URL returnerades från Supabase" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.signedUrl
    });
  } catch (error) {
    console.error("[bill-images] GET error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta bild-URL", details: errorMessage },
      { status: 500 }
    );
  }
}

