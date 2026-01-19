import { User, SubscriptionTier } from "@/lib/types";

/**
 * Check if user has active premium subscription
 */
export function isPremium(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Check if user has premium tier
  if (user.subscriptionTier !== 'premium') return false;
  
  // Check if subscription is active
  if (user.subscriptionStatus !== 'active') return false;
  
  // Check if subscription hasn't expired
  if (user.subscriptionExpiresAt) {
    const expiresAt = new Date(user.subscriptionExpiresAt);
    if (expiresAt < new Date()) return false;
  }
  
  return true;
}

/**
 * Get user's subscription tier (defaults to 'free')
 */
export function getUserTier(user: User | null | undefined): SubscriptionTier {
  if (!user || !user.subscriptionTier) return 'free';
  return user.subscriptionTier;
}

/**
 * Check if feature requires premium and user has it
 */
export function hasPremiumAccess(user: User | null | undefined, featureRequiresPremium: boolean = false): boolean {
  if (!featureRequiresPremium) return true; // Feature is free
  return isPremium(user);
}

/**
 * Premium feature limits
 */
export const PREMIUM_LIMITS = {
  FREE: {
    maxAnalysesHistory: 3, // Only last 3 months
    maxExportPerMonth: 0, // No exports
    maxBenchmarkingQueries: 0, // No advanced benchmarking
  },
  PREMIUM: {
    maxAnalysesHistory: Infinity, // Unlimited
    maxExportPerMonth: Infinity, // Unlimited
    maxBenchmarkingQueries: Infinity, // Unlimited
  },
} as const;

/**
 * Get limits for user based on their tier
 */
export function getUserLimits(user: User | null | undefined) {
  const tier = getUserTier(user);
  return tier === 'premium' ? PREMIUM_LIMITS.PREMIUM : PREMIUM_LIMITS.FREE;
}
