/**
 * Activate Premium for a user in D1 / MockDatabase.
 * Shared by Stripe webhook and success-page confirm fallback.
 */

export async function activatePremiumForEmail(
  db: any,
  userEmail: string,
  stripeSubscriptionId?: string | null
): Promise<boolean> {
  if (!userEmail) return false;

  const user = await db.getUserByEmail(userEmail);
  if (!user) {
    console.error("[activate-premium] User not found:", userEmail);
    return false;
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const isMockDatabase = db.constructor.name === "MockDatabase";

  if (isMockDatabase) {
    (user as any).subscriptionTier = "premium";
    (user as any).subscriptionStatus = "active";
    (user as any).subscriptionStartedAt = new Date(now);
    (user as any).subscriptionExpiresAt = new Date(expiresAt);
    if (stripeSubscriptionId) {
      (user as any).subscriptionStripeId = stripeSubscriptionId;
    }
    (user as any).updatedAt = new Date(now);
    return true;
  }

  await db.db
    .prepare(
      `
      UPDATE users
      SET subscription_tier = ?,
          subscription_status = ?,
          subscription_started_at = ?,
          subscription_expires_at = ?,
          subscription_stripe_id = COALESCE(?, subscription_stripe_id),
          updated_at = ?
      WHERE email = ?
    `
    )
    .bind(
      "premium",
      "active",
      now,
      expiresAt,
      stripeSubscriptionId || null,
      now,
      userEmail
    )
    .run();

  return true;
}
