import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createDatabaseFromBinding } from '@/lib/database';

// Cloudflare Pages requires Edge Runtime for all routes
export const runtime = 'edge';

// Helper function to get environment variable (works in Edge runtime)
function getEnvVar(key: string): string | undefined {
  // Try process.env first (works in both Node and Edge runtime)
  const fromProcess = (process.env as any)?.[key];
  if (typeof fromProcess === "string" && fromProcess.length > 0) return fromProcess;
  
  // Try getRequestContext (next-on-pages for Cloudflare Pages)
  try {
    const ctxEnv = (globalThis as any).getRequestContext?.()?.env;
    if (ctxEnv && typeof ctxEnv[key] === "string" && ctxEnv[key]) {
      return ctxEnv[key] as string;
    }
  } catch (e) {
    // getRequestContext might not be available or might throw
  }
  
  // Try globalThis.env (Cloudflare Workers)
  try {
    const workerEnv = (globalThis as any).env;
    if (workerEnv && typeof workerEnv[key] === "string" && workerEnv[key]) {
      return workerEnv[key] as string;
    }
  } catch (e) {
    // globalThis.env might not be available
  }
  
  return undefined;
}

/**
 * Stripe webhook handler
 * Handles subscription events from Stripe
 * POST /api/stripe/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      console.error('[Stripe Webhook] Stripe is not configured');
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Get webhook secret from environment (Edge Runtime compatible)
    const webhookSecret = getEnvVar('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
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

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const userEmail = session.metadata?.userEmail || session.customer_details?.email;

        if (userId && userEmail) {
          console.log(`[Stripe Webhook] Checkout completed for user: ${userEmail}`);
          
          // Update user subscription status
          const user = await db.getUserByEmail(userEmail);
          if (user) {
            const now = new Date().toISOString();
            const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

            // Check if this is MockDatabase
            const isMockDatabase = db.constructor.name === 'MockDatabase';
            
            if (isMockDatabase) {
              (user as any).subscriptionTier = 'premium';
              (user as any).subscriptionStatus = 'active';
              (user as any).subscriptionStartedAt = new Date(now);
              (user as any).subscriptionExpiresAt = new Date(expiresAt);
              (user as any).subscriptionStripeId = session.subscription;
              (user as any).updatedAt = new Date(now);
            } else {
              // For CloudflareDatabase, use SQL
              await (db as any).db.prepare(`
                UPDATE users 
                SET subscription_tier = ?,
                    subscription_status = ?,
                    subscription_started_at = ?,
                    subscription_expires_at = ?,
                    subscription_stripe_id = ?,
                    updated_at = ?
                WHERE email = ?
              `).bind(
                'premium',
                'active',
                now,
                expiresAt,
                session.subscription,
                now,
                userEmail
              ).run();
            }

            console.log(`[Stripe Webhook] User ${userEmail} upgraded to premium`);
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;
        const customerId = subscription.customer;

        if (customerId) {
          // Get customer to find email
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !customer.deleted && 'email' in customer && customer.email) {
            const userEmail = customer.email;
            console.log(`[Stripe Webhook] Subscription ${event.type} for user: ${userEmail}`);

            const user = await db.getUserByEmail(userEmail);
            if (user) {
              const isMockDatabase = db.constructor.name === 'MockDatabase';
              const now = new Date().toISOString();

              if (event.type === 'customer.subscription.deleted') {
                // Subscription cancelled
                if (isMockDatabase) {
                  (user as any).subscriptionTier = 'free';
                  (user as any).subscriptionStatus = 'cancelled';
                  (user as any).subscriptionExpiresAt = new Date(now);
                  (user as any).updatedAt = new Date(now);
                } else {
                  await (db as any).db.prepare(`
                    UPDATE users 
                    SET subscription_tier = ?,
                        subscription_status = ?,
                        subscription_expires_at = ?,
                        updated_at = ?
                    WHERE email = ?
                  `).bind('free', 'cancelled', now, now, userEmail).run();
                }
              } else {
                // Subscription updated (e.g., renewed)
                const expiresAt = subscription.current_period_end 
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

                if (isMockDatabase) {
                  (user as any).subscriptionTier = 'premium';
                  (user as any).subscriptionStatus = subscription.status === 'active' ? 'active' : 'cancelled';
                  (user as any).subscriptionExpiresAt = new Date(expiresAt);
                  (user as any).updatedAt = new Date(now);
                } else {
                  await (db as any).db.prepare(`
                    UPDATE users 
                    SET subscription_tier = ?,
                        subscription_status = ?,
                        subscription_expires_at = ?,
                        updated_at = ?
                    WHERE email = ?
                  `).bind(
                    'premium',
                    subscription.status === 'active' ? 'active' : 'cancelled',
                    expiresAt,
                    now,
                    userEmail
                  ).run();
                }
              }
            }
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
