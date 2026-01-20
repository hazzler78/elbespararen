/**
 * Stripe configuration and utilities
 */

import Stripe from 'stripe';

// Helper function to get environment variable (works in both Node and Edge runtime)
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

// Get Stripe secret key (works in Edge runtime)
function getStripeSecretKey(): string | undefined {
  return getEnvVar('STRIPE_SECRET_KEY') || getEnvVar('NEXT_PUBLIC_STRIPE_SECRET_KEY');
}

// Initialize Stripe - must be done at request time for Edge runtime
// We'll create a function that returns stripe instance dynamically
export function getStripe(): Stripe | null {
  const stripeSecretKey = getStripeSecretKey();
  
  if (!stripeSecretKey) {
    console.warn('[Stripe] Warning: STRIPE_SECRET_KEY not found in environment variables');
    return null;
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
}

// For backward compatibility, export stripe as a getter
// Note: This will be null at module load time in Edge runtime
// Use getStripe() function instead for Edge runtime compatibility
export const stripe = getStripe();

// Stripe publishable key for client-side
export function getStripePublishableKey(): string {
  return getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY') || '';
}

export const stripePublishableKey = getStripePublishableKey();

/**
 * Create a checkout session for premium subscription
 */
export async function createCheckoutSession(
  customerEmail: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session | null> {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    // Get or create Stripe customer
    let customer: Stripe.Customer;
    const customers = await stripeInstance.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripeInstance.customers.create({
        email: customerEmail,
        metadata: {
          userId: userId,
        },
      });
    }

    // Create checkout session for annual subscription
    // Price: 99 SEK per year
    const session = await stripeInstance.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sek',
            product_data: {
              name: 'Elbespararen Premium',
              description: 'Årsprenumeration med obegränsad historik, export-funktioner och avancerad analys',
            },
            unit_amount: 9900, // 99 SEK in öre
            recurring: {
              interval: 'year',
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        userEmail: customerEmail,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          userEmail: customerEmail,
        },
      },
    });

    return session;
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    return null;
  }

  try {
    return await stripeInstance.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('[Stripe] Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    throw new Error('Stripe is not configured');
  }

  try {
    return await stripeInstance.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('[Stripe] Error canceling subscription:', error);
    throw error;
  }
}
