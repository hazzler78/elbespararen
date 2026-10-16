/**
 * Google Analytics Event Tracking
 * Only tracks if analytics consent is given and analytics is enabled
 */

import { hasAnalyticsConsent } from './cookie-consent';

/** GA4 measurement ID (env override allowed, placeholder ignored) */
const GA_FALLBACK_ID = 'G-N8JHZQV6CT';
export const GA_MEASUREMENT_ID: string =
  process.env.NEXT_PUBLIC_GA_ID && process.env.NEXT_PUBLIC_GA_ID !== 'G-XXXXXXXXXX'
    ? process.env.NEXT_PUBLIC_GA_ID
    : GA_FALLBACK_ID;
/** GA is on unless explicitly disabled with NEXT_PUBLIC_ENABLE_GA=false */
export const GA_ENABLED: boolean = process.env.NEXT_PUBLIC_ENABLE_GA !== 'false';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    ttq?: any; // TikTok Pixel
  }
}

/**
 * Check if Google Analytics is enabled and consent is given
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  if (!GA_ENABLED || !GA_MEASUREMENT_ID) return false;
  
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
    window.gtag('config', GA_MEASUREMENT_ID, {
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

  // Chat interactions
  chatOpened: () => 
    trackEvent('chat_opened', 'engagement', 'chat'),
  
  chatMessageSent: (hasContext?: boolean) => 
    trackEvent('chat_message_sent', 'engagement', hasContext ? 'with_context' : 'without_context'),
  
  chatMessageReceived: (responseTimeMs?: number) => 
    trackEvent('chat_message_received', 'engagement', 'ai_response', responseTimeMs),
  
  chatError: (errorType: string) => 
    trackEvent('chat_error', 'error', errorType),

  // Premium conversion funnel
  premiumCtaClicked: (source: string) =>
    trackEvent('premium_cta_click', 'conversion', source),

  premiumCheckoutStarted: () =>
    trackEvent('premium_checkout_started', 'conversion', 'stripe'),

  premiumPageViewed: () =>
    trackEvent('premium_page_view', 'engagement', 'premium'),
};

