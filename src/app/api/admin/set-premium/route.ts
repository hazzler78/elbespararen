import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = 'edge';

/**
 * Admin endpoint to set a user to premium (for testing)
 * POST /api/admin/set-premium
 * Body: { email: string, tier: 'free' | 'premium' }
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
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

    const body = await req.json();
    const { email, tier } = body as { email?: string; tier?: string };

    if (!email || !tier || (tier !== "free" && tier !== "premium")) {
      return NextResponse.json(
        { success: false, error: "email och tier (free|premium) krävs" },
        { status: 400 }
      );
    }

    const targetUser = await db.getUserByEmail(email);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Målanvändare hittades inte" },
        { status: 404 }
      );
    }

    // Update subscription
    const now = new Date().toISOString();
    const expiresAt = tier === 'premium' 
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      : null;

    // Check if this is MockDatabase (for local development)
    const isMockDatabase = db.constructor.name === 'MockDatabase';
    
    if (isMockDatabase) {
      // For MockDatabase, update the user object directly
      (targetUser as any).subscriptionTier = tier;
      (targetUser as any).subscriptionStatus = 'active';
      (targetUser as any).subscriptionStartedAt = tier === 'premium' ? new Date(now) : undefined;
      (targetUser as any).subscriptionExpiresAt = expiresAt ? new Date(expiresAt) : undefined;
      (targetUser as any).updatedAt = new Date(now);
    } else {
      // For CloudflareDatabase, use SQL
      await (db as any).db.prepare(`
        UPDATE users 
        SET subscription_tier = ?,
            subscription_status = ?,
            subscription_started_at = ?,
            subscription_expires_at = ?,
            updated_at = ?
        WHERE email = ?
      `).bind(
        tier,
        tier === 'premium' ? 'active' : 'active',
        tier === 'premium' ? now : null,
        expiresAt,
        now,
        targetUser.email
      ).run();
    }

    return NextResponse.json({
      success: true,
      message: `Användare ${targetUser.email} är nu ${tier}`,
      data: {
        email: targetUser.email,
        tier,
        expiresAt
      }
    });
  } catch (error) {
    console.error("[admin/set-premium] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte uppdatera premium-status" },
      { status: 500 }
    );
  }
}
