// Cloudflare Pages Functions Cron Trigger
// Körs automatiskt enligt cron schedule

export async function onScheduled(event: any, env: any, ctx: any) {
  console.log('[Cron] Scheduled price update triggered at:', new Date().toISOString());

  try {
    // Anropa vår price update endpoint
    const baseUrl = `https://${event.cron}`.includes('elbespararen') 
      ? 'https://elbespararen.pages.dev' 
      : 'https://elbespararen.pages.dev'; // Fallback
    
    const updateUrl = `${baseUrl}/api/prices/update`;
    
    console.log(`[Cron] Calling price update endpoint: ${updateUrl}`);
    
    const response = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Cron/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Price update failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as any;
    
    console.log('[Cron] Price update completed successfully:', result);

    // Logga resultat
    const summary = result.summary || { total: 0, successful: 0, errors: 0 };
    console.log(`[Cron] Summary: ${summary.successful}/${summary.total} providers updated successfully, ${summary.errors} errors`);

  } catch (error) {
    console.error('[Cron] Fatal error in scheduled price update:', error);
    
    // I en riktig implementation skulle vi kanske skicka en notifikation här
    // t.ex. via Slack, email, eller annan monitoring service
  }
}
