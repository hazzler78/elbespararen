import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * POST /api/chat
 * Enkel AI-chatt för att svara på frågor om elbesparingar
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API-nyckel saknas" },
        { status: 500 }
      );
    }

    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Meddelande saknas" },
        { status: 400 }
      );
    }

    const systemPrompt = `Du är en expert på svenska elmarknaden och hjälper användare att förstå deras elräkningar och besparingsmöjligheter.

Var tydlig, vänlig och konkret. Förklara på ett enkelt sätt. Om användaren frågar om sin specifika faktura, använd kontexten som ges.

Regler:
- Svara alltid på svenska
- Var kortfattad (max 3-4 meningar)
- Fokusera på praktiska tips
- Nämn att elnätkostnader inte går att påverka
- Tipsa om spotpris som ett bra alternativ`;

    const messages: Array<{role: "system" | "user" | "assistant", content: string}> = [
      { role: "system", content: systemPrompt },
      ...(context ? [{ role: "assistant" as const, content: `Kontext från faktura: ${JSON.stringify(context)}` }] : []),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 300
    });

    const reply = response.choices[0].message.content;

    return NextResponse.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error("[chat] Error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte skapa svar" },
      { status: 500 }
    );
  }
}

