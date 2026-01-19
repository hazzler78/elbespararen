import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";

export const runtime = 'edge';

/**
 * Debug endpoint to list all users in database
 * GET /api/debug/users
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
    
    // If MockDatabase, access users directly
    if (db.constructor.name === 'MockDatabase') {
      const users = (db as any).users || [];
      return NextResponse.json({
        success: true,
        databaseType: 'MockDatabase',
        userCount: users.length,
        users: users.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          hasPassword: !!(u.passwordHash),
          createdAt: u.createdAt,
        })),
      });
    } else {
      // For CloudflareDatabase, we'd need to query SQL
      return NextResponse.json({
        success: true,
        databaseType: 'CloudflareDatabase',
        message: 'Use SQL query to list users',
      });
    }
  } catch (error) {
    console.error("[debug/users] GET error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
