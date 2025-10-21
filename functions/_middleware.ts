// Middleware för Cloudflare Pages Functions
// Hanterar cron job routing

export async function onRequest(context: any) {
  const { request, env, waitUntil } = context;
  const url = new URL(request.url);

  // Hantera cron jobs
  if (url.pathname === '/api/cron/prices' && request.method === 'GET') {
    // Verifiera cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Anropa price update endpoint
    const baseUrl = request.url.replace('/api/cron/prices', '');
    const updateUrl = `${baseUrl}/api/prices/update`;
    
    console.log(`[Cron] Calling price update: ${updateUrl}`);
    
    try {
      const response = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Cloudflare-Cron/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Price update failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('[Cron] Price update completed:', result);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Scheduled price update completed",
          timestamp: new Date().toISOString(),
          result: result
        }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('[Cron] Error in scheduled price update:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "Scheduled price update failed",
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Fortsätt med normal request processing
  return context.next();
}
