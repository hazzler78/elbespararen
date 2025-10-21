import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

// Cron job handler för att uppdatera priser automatiskt
export async function GET(request: NextRequest) {
  try {
    console.log('[Cron] Starting scheduled price update...');
    
    // Verifiera att detta är en legitim cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Cron] Unauthorized cron request');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Anropa vår price update endpoint
    const baseUrl = process.env.VERCEL_URL || process.env.CF_PAGES_URL || 'https://elbespararen.pages.dev';
    const updateUrl = `${baseUrl}/api/prices/update`;
    
    console.log(`[Cron] Calling price update endpoint: ${updateUrl}`);
    
    const response = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Elbespararen-Cron/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Price update failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('[Cron] Price update completed:', result);

    return NextResponse.json({
      success: true,
      message: "Scheduled price update completed",
      timestamp: new Date().toISOString(),
      result: result
    });

  } catch (error) {
    console.error('[Cron] Error in scheduled price update:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Scheduled price update failed",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
