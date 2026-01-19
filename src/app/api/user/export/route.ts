import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createDatabaseFromBinding } from "@/lib/database";
import { isPremium } from "@/lib/premium";

export const runtime = 'edge';

/**
 * Export user's bill analyses as CSV, Excel, or PDF
 * GET /api/user/export?format=csv|excel|pdf&range=month|3months|year|all
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await getSessionUser(req);
    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: "Ej autentiserad" },
        { status: 401 }
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

    // Get user from database
    const dbUser = await db.createOrUpdateUser({
      email: user.email,
      name: user.name,
      image: user.image,
    });

    // Check premium access
    const hasPremium = isPremium(dbUser);
    if (!hasPremium) {
      return NextResponse.json(
        { success: false, error: "Premium krävs för export-funktioner" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'csv'; // csv, excel, pdf
    const range = url.searchParams.get('range') || 'all';

    // Get user's analyses
    const analyses = await db.getBillAnalysesByUserId(dbUser.id, range);

    if (analyses.length === 0) {
      return NextResponse.json(
        { success: false, error: "Inga analyser att exportera" },
        { status: 404 }
      );
    }

    // Generate export based on format
    if (format === 'csv') {
      return generateCSV(analyses, dbUser);
    } else if (format === 'excel') {
      return generateExcel(analyses, dbUser);
    } else if (format === 'pdf') {
      return generatePDF(analyses, dbUser);
    } else {
      return NextResponse.json(
        { success: false, error: "Ogiltigt format. Använd csv, excel eller pdf" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[user/export] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Kunde inte exportera data" },
      { status: 500 }
    );
  }
}

function generateCSV(analyses: any[], user: any): NextResponse {
  const headers = [
    'Datum',
    'Period',
    'Förbrukning (kWh)',
    'Totalt belopp (kr)',
    'Elnätskostnad (kr)',
    'Elhandelskostnad (kr)',
    'Extraavgifter (kr)',
    'Kontraktstyp',
    'Prisområde',
    'Potentiell besparing (kr)',
    'Besparingsprocent (%)',
    'AI Confidence',
  ];

  const rows = analyses.map(analysis => [
    new Date(analysis.createdAt).toLocaleDateString('sv-SE'),
    analysis.billData.period || '',
    analysis.billData.totalKWh || 0,
    analysis.billData.totalAmount || 0,
    analysis.billData.elnatCost || 0,
    analysis.billData.elhandelCost || 0,
    analysis.billData.extraFeesTotal || 0,
    analysis.billData.contractType || '',
    analysis.billData.priceArea || '',
    analysis.savings.potentialSavings || 0,
    analysis.savings.savingsPercentage || 0,
    analysis.aiConfidence ? (analysis.aiConfidence * 100).toFixed(1) + '%' : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const filename = `elbespararen-analyser-${user.email}-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function generateExcel(analyses: any[], user: any): NextResponse {
  // For now, return CSV format (Excel can open CSV)
  // In the future, we can use a library like exceljs to generate proper Excel files
  return generateCSV(analyses, user);
}

function generatePDF(analyses: any[], user: any): NextResponse {
  // For now, return JSON (PDF generation requires a library like pdfkit or puppeteer)
  // This is a placeholder - implement proper PDF generation later
  const pdfData = {
    user: {
      email: user.email,
      name: user.name,
    },
    generatedAt: new Date().toISOString(),
    totalAnalyses: analyses.length,
    analyses: analyses.map(a => ({
      date: new Date(a.createdAt).toLocaleDateString('sv-SE'),
      period: a.billData.period,
      totalAmount: a.billData.totalAmount,
      potentialSavings: a.savings.potentialSavings,
    })),
  };

  return NextResponse.json(
    { 
      success: false, 
      error: "PDF-export kommer snart. Använd CSV eller Excel för nu.",
      data: pdfData 
    },
    { status: 501 }
  );
}
