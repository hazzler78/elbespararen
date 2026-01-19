import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import { hashPassword } from "@/lib/password";

export const runtime = 'edge';

/**
 * Register a new user with email and password
 * POST /api/auth/register
 * Body: { name: string, email: string, password: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Namn, e-post och lösenord krävs" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Lösenordet måste vara minst 8 tecken" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Ogiltig e-postadress" },
        { status: 400 }
      );
    }

    // Get database
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

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "En användare med denna e-postadress finns redan" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const now = new Date().toISOString();
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await (db as any).db.prepare(`
      INSERT INTO users (id, email, name, password_hash, created_at, updated_at, subscription_tier, subscription_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      email,
      name,
      passwordHash,
      now,
      now,
      'free',
      'active'
    ).run();

    return NextResponse.json({
      success: true,
      message: "Konto skapat framgångsrikt",
      data: {
        id,
        email,
        name,
      }
    });
  } catch (error) {
    console.error("[auth/register] POST error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('unique')) {
      return NextResponse.json(
        { success: false, error: "En användare med denna e-postadress finns redan" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Kunde inte skapa konto" },
      { status: 500 }
    );
  }
}
