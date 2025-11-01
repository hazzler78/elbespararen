/**
 * Cookie Consent Management
 * Handles user consent for analytics cookies (Google Analytics)
 */

export type CookieConsent = {
  analytics: boolean;
  timestamp: number;
};

const COOKIE_CONSENT_KEY = 'elbespararen_cookie_consent';

/**
 * Get current cookie consent status
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    
    const consent = JSON.parse(stored) as CookieConsent;
    // Validate structure
    if (typeof consent.analytics === 'boolean' && typeof consent.timestamp === 'number') {
      return consent;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if analytics consent is given
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics === true;
}

/**
 * Set cookie consent
 */
export function setCookieConsent(analytics: boolean): void {
  if (typeof window === 'undefined') return;
  
  const consent: CookieConsent = {
    analytics,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('Failed to save cookie consent:', error);
  }
}

/**
 * Clear cookie consent (for testing/debugging)
 */
export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch (error) {
    console.error('Failed to clear cookie consent:', error);
  }
}

/**
 * Check if consent has been given (any consent, not necessarily analytics)
 */
export function hasGivenConsent(): boolean {
  return getCookieConsent() !== null;
}

