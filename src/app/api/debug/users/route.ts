import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";

export const runtime = 'edge';

/**
 * Debug endpoint to list and delete users in database
 * GET /api/debug/users - List all users
 * DELETE /api/debug/users?email=... - Delete user by email
 * DELETE /api/debug/users?clear=all - Clear all users (MockDatabase only)
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
      return NextResponse.json({
        success: true,
        databaseType: 'MockDatabase',
        storeId: store.getInstanceId(),
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const clear = searchParams.get('clear');

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
    
    // If MockDatabase, delete users via shared store
    if (db.constructor.name === 'MockDatabase') {
      const { getMockStore } = await import('@/lib/database/mock-store');
      const store = getMockStore();
      
      if (clear === 'all') {
        // Clear all users
        const deletedCount = store.clearAll();
        console.log(`[debug/users] Cleared all users from MockDatabase`);
        return NextResponse.json({
          success: true,
          message: 'All users cleared from MockDatabase',
          deletedCount,
        });
      } else if (email) {
        // Delete specific user by email
        const deleted = store.deleteUser(email);
        
        if (deleted) {
          console.log(`[debug/users] Deleted user: ${email}`);
          return NextResponse.json({
            success: true,
            message: `User ${email} deleted from MockDatabase`,
            deletedCount: 1,
          });
        } else {
          return NextResponse.json({
            success: false,
            message: `User ${email} not found in MockDatabase`,
          }, { status: 404 });
        }
      } else {
        return NextResponse.json({
          success: false,
          error: 'Please provide email parameter or clear=all',
        }, { status: 400 });
      }
    } else {
      // For CloudflareDatabase, we'd need SQL DELETE
      return NextResponse.json({
        success: false,
        message: 'Use SQL DELETE for CloudflareDatabase',
      }, { status: 400 });
    }
  } catch (error) {
    console.error("[debug/users] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
