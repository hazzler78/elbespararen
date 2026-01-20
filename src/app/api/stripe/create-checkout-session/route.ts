import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

export const runtime = 'edge';

/**
 * Create a Stripe checkout session for premium subscription
 * POST /api/stripe/create-checkout-session
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getSessionUser(req);
    if (!user?.email || !user?.id) {
      return NextResponse.json(
        { success: false, error: 'Ej autentiserad' },
        { status: 401 }
      );
    }

    // Get base URL from request
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const successUrl = `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/premium?canceled=true`;

    // Create checkout session
    const session = await createCheckoutSession(
      user.email,
      user.id,
      successUrl,
      cancelUrl
    );

    if (!session || !session.url) {
      return NextResponse.json(
        { success: false, error: 'Kunde inte skapa checkout-session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[stripe/create-checkout-session] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Kunde inte skapa checkout-session' 
      },
      { status: 500 }
    );
  }
}
