import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import { BillAnalysis } from "@/lib/types";

export const runtime = 'edge';

// GET - Hämta en specifik fakturaanalys
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const analysis = await db.getBillAnalysis(params.id);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Fakturaanalys hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error("[bill-analyses] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte hämta fakturaanalys" },
      { status: 500 }
    );
  }
}

// PUT - Uppdatera fakturaanalys (t.ex. valideringsstatus)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as {
      validationStatus?: BillAnalysis['validationStatus'];
      validationNotes?: string;
      validatedBy?: string;
    };

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

    const updateData: Partial<BillAnalysis> = {};
    
    if (body.validationStatus !== undefined) {
      updateData.validationStatus = body.validationStatus;
    }
    if (body.validationNotes !== undefined) {
      updateData.validationNotes = body.validationNotes;
    }
    if (body.validatedBy !== undefined) {
      updateData.validatedBy = body.validatedBy;
    }

    // Sätt validatedAt om status ändras från pending
    if (body.validationStatus && body.validationStatus !== 'pending') {
      updateData.validatedAt = new Date();
    }

    const updated = await db.updateBillAnalysis(params.id, updateData);

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error("[bill-analyses] PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte uppdatera fakturaanalys" },
      { status: 500 }
    );
  }
}

// DELETE - Ta bort fakturaanalys
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const deleted = await db.deleteBillAnalysis(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Fakturaanalys hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Fakturaanalys borttagen"
    });
  } catch (error) {
    console.error("[bill-analyses] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte ta bort fakturaanalys" },
      { status: 500 }
    );
  }
}

