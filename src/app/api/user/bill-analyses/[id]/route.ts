import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createDatabaseFromBinding } from "@/lib/database";

export const runtime = 'edge';

/**
 * DELETE /api/user/bill-analyses/[id]
 * Delete a bill analysis that belongs to the authenticated user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Hämta session (användare måste vara inloggad)
    const user = await getSessionUser(req);
    
    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Hämta D1-binding från Edge-runtime
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

    // Skapa eller hämta användare
    const dbUser = await db.createOrUpdateUser({
      email: user.email,
      name: user.name,
      image: user.image,
    });

    // Kontrollera att fakturan tillhör användaren
    const analysis = await db.getBillAnalysis(id);
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Fakturaanalys hittades inte" },
        { status: 404 }
      );
    }

    if (analysis.userId !== dbUser.id) {
      return NextResponse.json(
        { success: false, error: "Du har inte behörighet att ta bort denna faktura" },
        { status: 403 }
      );
    }

    // Ta bort fakturan
    const deleted = await db.deleteBillAnalysis(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Kunde inte ta bort fakturaanalys" },
        { status: 500 }
      );
    }

    console.log(`[user/bill-analyses] ✅ Faktura ${id} borttagen av användare ${dbUser.id}`);

    return NextResponse.json({
      success: true,
      message: "Faktura borttagen"
    });
  } catch (error) {
    console.error("[user/bill-analyses] DELETE error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { success: false, error: "Kunde inte ta bort faktura" },
      { status: 500 }
    );
  }
}
