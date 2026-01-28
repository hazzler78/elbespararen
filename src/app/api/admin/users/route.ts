import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import { ApiResponse } from "@/lib/types";

export const runtime = 'edge';

/**
 * Admin endpoint to list all users with premium/membership status
 * GET /api/admin/users
 */
export async function GET(req: NextRequest) {
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
    
    // If MockDatabase, access users via shared store
    if (db.constructor.name === 'MockDatabase') {
      const { getMockStore } = await import('@/lib/database/mock-store');
      const store = getMockStore();
      const users = store.getUsers();
      
      const usersWithPremium = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name || null,
        subscriptionTier: u.subscriptionTier || 'free',
        subscriptionStatus: u.subscriptionStatus || null,
        subscriptionStartedAt: u.subscriptionStartedAt ? u.subscriptionStartedAt.toISOString() : null,
        subscriptionExpiresAt: u.subscriptionExpiresAt ? u.subscriptionExpiresAt.toISOString() : null,
        subscriptionStripeId: u.subscriptionStripeId || null,
        createdAt: u.createdAt ? u.createdAt.toISOString() : null,
        updatedAt: u.updatedAt ? u.updatedAt.toISOString() : null,
      }));
      
      // Calculate statistics
      const stats = {
        total: usersWithPremium.length,
        premium: usersWithPremium.filter((u: any) => u.subscriptionTier === 'premium').length,
        free: usersWithPremium.filter((u: any) => u.subscriptionTier === 'free').length,
        activePremium: usersWithPremium.filter((u: any) => 
          u.subscriptionTier === 'premium' && u.subscriptionStatus === 'active'
        ).length,
      };
      
      return NextResponse.json({
        success: true,
        databaseType: 'MockDatabase',
        data: {
          stats,
          users: usersWithPremium,
        },
      } as ApiResponse<{ stats: typeof stats; users: typeof usersWithPremium }>);
    } else {
      // For CloudflareDatabase, query SQL
      try {
        const result = await (db as any).db.prepare(`
          SELECT 
            id,
            email,
            name,
            subscription_tier,
            subscription_status,
            subscription_started_at,
            subscription_expires_at,
            subscription_stripe_id,
            created_at,
            updated_at
          FROM users
          ORDER BY created_at DESC
        `).all();
      
      const rows = Array.isArray(result.results) ? result.results : [];
      
      const usersWithPremium = rows.map((row: any) => ({
        id: String(row.id),
        email: String(row.email),
        name: row.name ? String(row.name) : null,
        subscriptionTier: row.subscription_tier ? String(row.subscription_tier) : 'free',
        subscriptionStatus: row.subscription_status ? String(row.subscription_status) : null,
        subscriptionStartedAt: row.subscription_started_at ? String(row.subscription_started_at) : null,
        subscriptionExpiresAt: row.subscription_expires_at ? String(row.subscription_expires_at) : null,
        subscriptionStripeId: row.subscription_stripe_id ? String(row.subscription_stripe_id) : null,
        createdAt: row.created_at ? String(row.created_at) : null,
        updatedAt: row.updated_at ? String(row.updated_at) : null,
      }));
      
      // Calculate statistics
      const stats = {
        total: usersWithPremium.length,
        premium: usersWithPremium.filter((u: any) => u.subscriptionTier === 'premium').length,
        free: usersWithPremium.filter((u: any) => u.subscriptionTier === 'free').length,
        activePremium: usersWithPremium.filter((u: any) => 
          u.subscriptionTier === 'premium' && u.subscriptionStatus === 'active'
        ).length,
      };
      
        return NextResponse.json({
          success: true,
          databaseType: 'CloudflareDatabase',
          data: {
            stats,
            users: usersWithPremium,
          },
        } as ApiResponse<{ stats: typeof stats; users: typeof usersWithPremium }>);
      } catch (sqlError) {
        console.error('[admin/users] SQL error:', sqlError);
        // If table doesn't exist, return empty result
        if (String(sqlError).includes('no such table')) {
          return NextResponse.json({
            success: true,
            databaseType: 'CloudflareDatabase',
            data: {
              stats: { total: 0, premium: 0, free: 0, activePremium: 0 },
              users: [],
            },
          } as ApiResponse<{ stats: any; users: any[] }>);
        }
        throw sqlError;
      }
    }
  } catch (error) {
    console.error("[admin/users] GET error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
