import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API-nyckel saknas" },
        { status: 500 }
      );
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Parse and validate request body
    let body: { message?: string; context?: unknown };
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Ogiltigt JSON-format" },
        { status: 400 }
      );
    }

    const { message, context } = body;

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

    // Enhanced system prompt with better context handling
    const systemPrompt = `Du är en expert på svenska elmarknaden och hjälper användare att förstå deras elräkningar och besparingsmöjligheter.

Var tydlig, vänlig och konkret. Förklara på ett enkelt sätt. Om användaren frågar om sin specifika faktura, använd kontexten som ges.

Regler:
- Svara alltid på svenska
- Var kortfattad (max 3-4 meningar)
- Fokusera på praktiska tips
- Nämn att elnätkostnader inte går att påverka
- Tipsa om spotpris som ett bra alternativ
- Om du får kontext från en faktura, använd den för att ge mer specifika råd
- Var alltid ärlig om osäkerheter`;

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

    // Call OpenAI with enhanced error handling
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 300,
      timeout: 30000 // 30 second timeout
    });

    const reply = response.choices[0]?.message?.content;

    if (!reply) {
      throw new Error("Tom respons från OpenAI");
    }

    // Log successful interaction (without sensitive data)
    console.log(`[chat] Successful interaction - IP: ${clientIP}, Message length: ${message.length}, Has context: ${!!context}`);

    return NextResponse.json({
      success: true,
      reply: reply.trim(),
      meta: {
        model: "gpt-4o-mini",
        timestamp: new Date().toISOString(),
        messageLength: message.length,
        hasContext: !!context
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

