import { NextRequest, NextResponse } from "next/server";
import { addToNewsletter, getDefaultNewsletterGroupId } from "@/lib/email";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { 
      email?: string; 
      name?: string;
    };
    
    const { email, name } = body;
    
    console.log("[newsletter] POST request received:", { email, hasName: !!name });

    // Validera input
    if (!email) {
      return NextResponse.json(
        { success: false, error: "E-postadress krävs" },
        { status: 400 }
      );
    }

    // Validera e-post format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Ogiltig e-postadress" },
        { status: 400 }
      );
    }

    // Lägg till i nyhetsbrev
    try {
      const newsletterGroupId = getDefaultNewsletterGroupId();
      console.log("[newsletter] Adding to newsletter:", { email, name, group: newsletterGroupId });
      
      await addToNewsletter({ email, name }, newsletterGroupId);
      
      console.log("[newsletter] Successfully subscribed:", email);
      
      return NextResponse.json({
        success: true,
        message: "Du är nu anmäld till nyhetsbrevet"
      });
    } catch (e) {
      console.error("[newsletter] addToNewsletter failed:", e);
      
      // Om användaren redan finns, räkna det som framgång
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (errorMessage.includes("already") || errorMessage.includes("exists") || errorMessage.includes("409")) {
        return NextResponse.json({
          success: true,
          message: "Du är redan anmäld till nyhetsbrevet"
        });
      }
      
      throw e;
    }
  } catch (error) {
    console.error("[newsletter] POST error:", error);
    const errorMessage = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { success: false, error: `Kunde inte anmäla dig till nyhetsbrevet: ${errorMessage}` },
      { status: 500 }
    );
  }
}

