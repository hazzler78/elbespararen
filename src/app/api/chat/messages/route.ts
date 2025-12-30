import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

/**
 * GET /api/chat/messages
 * Hämtar chat-meddelanden för admin-panelen
 * Query params:
 * - sessionId: Filtrera på specifik session
 * - limit: Max antal meddelanden att hämta (default: 100)
 * - search: Sök i meddelandetexten
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    const searchTerm = searchParams.get('search') || undefined;

    // Hämta D1-binding från Edge-runtime
    let env: any = {};
    
    // Metod 1: getRequestContext (next-on-pages)
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    
    // Metod 2: process.env.DB (direkt access)
    if (!env.DB && (process.env as any).DB) {
      env.DB = (process.env as any).DB;
    }
    
    // Metod 3: globalThis.env (Cloudflare Workers)
    if (!env.DB && (globalThis as any).env?.DB) {
      env.DB = (globalThis as any).env.DB;
    }
    
    const db = createDatabaseFromBinding(env?.DB);
    const messages = await db.getChatMessages(sessionId, limit, searchTerm);
    
    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error("[chat/messages] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta chat-meddelanden" },
      { status: 500 }
    );
  }
}

