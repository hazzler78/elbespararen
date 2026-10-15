import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import { ChatMessage } from "@/lib/types";
import {
  AI_CHAT_MODEL,
  createAiClient,
  hasXaiApiKey,
} from "@/lib/ai-client";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

// Rate limiting (simple in-memory store for demo - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

/**
 * POST /api/chat
 * Förbättrad AI-chatt för att svara på frågor om elbesparingar
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const userLimit = rateLimitStore.get(clientIP);
    
    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
          return NextResponse.json(
            { error: "För många förfrågningar. Försök igen om en minut." },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    if (!hasXaiApiKey()) {
      return NextResponse.json(
        { error: "XAI_API_KEY saknas" },
        { status: 500 }
      );
    }

    const openai = createAiClient();

    // Parse and validate request body
    let body: { message?: string; context?: unknown; sessionId?: string };
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Ogiltigt JSON-format" },
        { status: 400 }
      );
    }

    const { message, context, sessionId } = body;
    
    // Generate session ID if not provided
    const chatSessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get user agent
    const userAgent = req.headers.get('user-agent') || undefined;
    
    // Get database connection
    let env: any = {};
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    if (!env.DB && (process.env as any).DB) {
      env.DB = (process.env as any).DB;
    }
    if (!env.DB && (globalThis as any).env?.DB) {
      env.DB = (globalThis as any).env.DB;
    }
    const db = createDatabaseFromBinding(env?.DB);

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Meddelande saknas eller är ogiltigt" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: "Meddelande får inte vara tomt" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Meddelande är för långt (max 2000 tecken)" },
        { status: 400 }
      );
    }

    const systemPrompt = `Du är Elbespararens chatt — en hjälpsam, jordnära guide på svenska elmarknaden. Du pratar som en kunnig kompis, inte som en FAQ eller säljare.

## Mål
Hjälp besökaren ta nästa steg: 1) ladda upp faktura, 2) förstå besparingen, 3) byta elavtal. Konvertera genom tydlighet och trygghet — aldrig pushighet.

## Språk (kritiskt)
- Elbespararen är en webbplats (elbespararen.se) — ALDRIG "app", "App Store" eller "ladda ner".
- Säg "här på sajten", "ladda upp fakturan", "gå till Analysera faktura".
- Du: vänlig, konkret, vardaglig svenska. Inga bulletlistor. Inga långa föreläsningar.

## Svarslängd
- MAX 2 korta meningar + gärna en enkel följdfråga ELLER ett tydligt nästa steg.
- Max ~60 ord. Hellre för kort än för långt.
- Undvik uppräkningar ("Jag kan hjälpa dig med: …").

## Fakta du får använda
- Gratis fakturaanalys (bild/PDF). AI hittar onödiga tilläggsavgifter och jämför mot spotpris.
- Elnätsavgifter går inte att byta bort; elhandel och tillägg går ofta att påverka.
- Efter analys visas leverantörsförslag med tydlig sparpotential — byt via knappen på resultatsidan.
- Premium (intro ca 49 kr/år) bara om de frågar om historik, obegränsade sparanden eller CSV — nämn det inte i varje svar.

## När de har fakturakontext
- Använd siffrorna. Säg ungefär hur mycket som ser ut som onödiga avgifter.
- Peka mot "Byt elavtal" på resultatsidan om de undrar hur de sparar på riktigt.

## När de saknar faktura
- Led mjukt till uppladdning: "Ladda upp en faktura under Analysera faktura — tar under en minut."

## Exempelton
Fråga: "Vad kostar detta?"
→ "Analysen är gratis. Ladda upp fakturan så ser du direkt vad du kan spara — vill du att jag guidar dig?"

Fråga: "Vem ska jag byta till?"
→ "Bäst är att utgå från din faktura. Ladda upp den så får du förslag med sparpotential — har du den nära till hands?"

Fråga: "Hittar den inte i App Store"
→ "Ingen app behövs — öppna elbespararen.se i webbläsaren och analysera fakturan där."

Fråga: "Hur sparar jag?"
→ "Många betalar onödiga tilläggsavgifter. Ladda upp fakturan så visar vi hur mycket du kan skära bort och hur du byter."`

    // Build messages array with proper context handling
    const messages: Array<{role: "system" | "user" | "assistant", content: string}> = [
      { role: "system", content: systemPrompt }
    ];

    // Add context if provided
    if (context && typeof context === 'object') {
      const contextStr = `Kontext från faktura: ${JSON.stringify(context, null, 2)}`;
      messages.push({ role: "assistant", content: contextStr });
    }

    // Add user message
    messages.push({ role: "user", content: message.trim() });

    // Save user message to database
    try {
      await db.createChatMessage({
        sessionId: chatSessionId,
        role: 'user',
        content: message.trim(),
        context: context && typeof context === 'object' ? context as ChatMessage['context'] : undefined,
        ipAddress: clientIP,
        userAgent: userAgent
      });
    } catch (dbError) {
      console.error("[chat] Failed to save user message to database:", dbError);
      // Continue even if database save fails
    }

    // Call OpenAI with enhanced error handling
    const startTime = Date.now();
    let response;
    let reply: string | null = null;
    let responseTimeMs: number | undefined;
    let errorMessage: string | undefined;

    try {
      response = await openai.chat.completions.create({
        model: AI_CHAT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 120, // Korta, konverterande svar
        presence_penalty: 0.3,
      });

      reply = response.choices[0]?.message?.content || null;
      responseTimeMs = Date.now() - startTime;

      if (!reply) {
        throw new Error("Tom respons från OpenAI");
      }
    } catch (openaiError) {
      responseTimeMs = Date.now() - startTime;
      errorMessage = openaiError instanceof Error ? openaiError.message : String(openaiError);
      
      // Save error to database
      try {
        await db.createChatMessage({
          sessionId: chatSessionId,
          role: 'assistant',
          content: '',
          ipAddress: clientIP,
          userAgent: userAgent,
          model: AI_CHAT_MODEL,
          responseTimeMs,
          error: errorMessage
        });
      } catch (dbError) {
        console.error("[chat] Failed to save error message to database:", dbError);
      }
      
      throw openaiError;
    }

    // Save assistant response to database
    try {
      await db.createChatMessage({
        sessionId: chatSessionId,
        role: 'assistant',
        content: reply.trim(),
        context: context && typeof context === 'object' ? context as ChatMessage['context'] : undefined,
        ipAddress: clientIP,
        userAgent: userAgent,
        model: AI_CHAT_MODEL,
        responseTimeMs
      });
    } catch (dbError) {
      console.error("[chat] Failed to save assistant message to database:", dbError);
      // Continue even if database save fails
    }

    // Log successful interaction (without sensitive data)
    console.log(`[chat] Successful interaction - IP: ${clientIP}, Session: ${chatSessionId}, Message length: ${message.length}, Has context: ${!!context}, Response time: ${responseTimeMs}ms`);

    return NextResponse.json({
      success: true,
      reply: reply.trim(),
      sessionId: chatSessionId,
      meta: {
        model: AI_CHAT_MODEL,
        timestamp: new Date().toISOString(),
        messageLength: message.length,
        hasContext: !!context,
        responseTimeMs
      }
    });

  } catch (error) {
    console.error("[chat] Error:", error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: "AI:n är för tillfället överbelastad. Försök igen om en stund." },
          { status: 429 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { success: false, error: "Förfrågan tog för lång tid. Försök igen." },
          { status: 408 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Kunde inte skapa svar. Försök igen." },
      { status: 500 }
    );
  }
}

