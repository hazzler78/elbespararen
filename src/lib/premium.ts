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
    /** Max sparade analyser kopplade till kontot (gratis) */
    maxSavedAnalyses: 2,
    maxExportPerMonth: 0, // No exports
    maxBenchmarkingQueries: 0, // No advanced benchmarking
  },
  PREMIUM: {
    maxAnalysesHistory: Infinity, // Unlimited
    maxSavedAnalyses: Infinity,
    maxExportPerMonth: Infinity, // Unlimited
    maxBenchmarkingQueries: Infinity, // Unlimited
  },
} as const;

/**
 * Get limits for user based on their tier
 */
export function getUserLimits(user: User | null | undefined) {
  // Use isPremium() so expired subscriptions fall back to free limits
  return isPremium(user) ? PREMIUM_LIMITS.PREMIUM : PREMIUM_LIMITS.FREE;
}

/**
 * Can this user attach another analysis to their account?
 * Free: max 2 saved. Premium: unlimited.
 */
export function canSaveAnalysisToAccount(
  user: User | null | undefined,
  currentSavedCount: number
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getUserLimits(user);
  const limit = limits.maxSavedAnalyses;
  if (!Number.isFinite(limit)) {
    return { allowed: true, limit: Infinity, remaining: Infinity };
  }
  const remaining = Math.max(0, limit - currentSavedCount);
  return { allowed: remaining > 0, limit, remaining };
}

/** History ranges the API/UI understand */
export type HistoryRange = "month" | "3months" | "year" | "all";

const FREE_HISTORY_RANGES: HistoryRange[] = ["month", "3months"];
const PREMIUM_HISTORY_RANGES: HistoryRange[] = ["month", "3months", "year", "all"];

/**
 * Free users: month + 3 months only.
 * Premium: all ranges.
 */
export function getAllowedHistoryRanges(user: User | null | undefined): HistoryRange[] {
  return isPremium(user) ? PREMIUM_HISTORY_RANGES : FREE_HISTORY_RANGES;
}

/**
 * Clamp a requested range to what the user's tier allows.
 * Returns the effective range and whether it was limited.
 */
export function clampHistoryRange(
  user: User | null | undefined,
  requested: string | null | undefined
): { range: HistoryRange; limited: boolean } {
  const allowed = getAllowedHistoryRanges(user);
  const fallback: HistoryRange = isPremium(user) ? "year" : "3months";
  const raw = (requested || fallback) as HistoryRange;
  const valid: HistoryRange[] = ["month", "3months", "year", "all"];
  const requestedRange = valid.includes(raw) ? raw : fallback;

  if (allowed.includes(requestedRange)) {
    return { range: requestedRange, limited: false };
  }

  return { range: "3months", limited: true };
}
