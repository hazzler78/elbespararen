/**
 * Google Analytics Event Tracking
 * Only tracks if analytics consent is given and analytics is enabled
 */

import { hasAnalyticsConsent } from './cookie-consent';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Check if Google Analytics is enabled and consent is given
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if analytics is enabled via environment variable
  const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  if (!analyticsEnabled) return false;
  
  // Check if GA ID is set
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId || gaId === 'G-XXXXXXXXXX') return false;
  
  // Check if user has given consent
  return hasAnalyticsConsent();
}

/**
 * Track a Google Analytics event
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
): void {
  if (!isAnalyticsEnabled() || !window.gtag) return;
  
  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  if (!isAnalyticsEnabled() || !window.gtag) return;
  
  try {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      page_path: path,
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

/**
 * Track custom event with custom parameters
 */
export function trackCustomEvent(eventName: string, parameters?: Record<string, any>): void {
  if (!isAnalyticsEnabled() || !window.gtag) return;
  
  try {
    window.gtag('event', eventName, parameters || {});
  } catch (error) {
    console.error('Failed to track custom event:', error);
  }
}

/**
 * Predefined events for common actions
 */
export const AnalyticsEvents = {
  // Bill upload
  billUploaded: (success: boolean) => 
    trackEvent('bill_upload', 'engagement', success ? 'success' : 'failed'),
  
  // Lead creation
  leadCreated: () => 
    trackEvent('lead_created', 'conversion', 'contact_form'),
  
  // Newsletter subscription
  newsletterSubscribed: () => 
    trackEvent('newsletter_subscribed', 'engagement', 'newsletter'),
  
  // Switch request
  switchRequestStarted: () => 
    trackEvent('switch_request_started', 'engagement', 'provider_switch'),
  
  switchRequestCompleted: (providerName?: string) => 
    trackEvent('switch_request_completed', 'conversion', providerName || 'provider_switch'),
  
  // Page interactions
  contactFormOpened: () => 
    trackEvent('contact_form_opened', 'engagement', 'contact'),
  
  providerComparisonViewed: () => 
    trackEvent('provider_comparison_viewed', 'engagement', 'comparison'),
  
  // Errors
  errorOccurred: (errorType: string) => 
    trackEvent('error_occurred', 'error', errorType),
};

