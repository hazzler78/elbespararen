"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { hasAnalyticsConsent } from '@/lib/cookie-consent';

/**
 * Google Analytics Component
 * Only loads GA script if:
 * 1. NEXT_PUBLIC_ENABLE_ANALYTICS is true
 * 2. NEXT_PUBLIC_GA_ID is set (and not placeholder)
 * 3. User has given analytics consent
 */
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Don't load if disabled or no ID
  if (!analyticsEnabled || !gaId || gaId === 'G-XXXXXXXXXX') {
    return null;
  }

  useEffect(() => {
    // Check consent on client side only
    const checkConsent = () => {
      if (typeof window !== 'undefined') {
        const hasConsent = hasAnalyticsConsent();
        
        if (hasConsent && !shouldLoad) {
          // Only load if we haven't loaded yet
          setShouldLoad(true);
          
          // Initialize dataLayer if it doesn't exist
          window.dataLayer = window.dataLayer || [];
          
          // Define gtag function
          function gtag(...args: any[]) {
            window.dataLayer!.push(args);
          }
          
          // Make gtag available globally
          window.gtag = gtag;
          
          // Configure GA
          gtag('js', new Date());
          gtag('config', gaId, {
            anonymize_ip: true, // GDPR compliance - anonymize IP
            allow_google_signals: false, // Disable advertising features for GDPR
            allow_ad_personalization_signals: false,
          });

          // Dynamically load GA script if not already loaded
          if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
            const script1 = document.createElement('script');
            script1.async = true;
            script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(script1);
          }
        } else if (!hasConsent) {
          setShouldLoad(false);
        }
      }
    };

    // Check initial consent
    checkConsent();

    // Listen for consent changes
    const handleConsentChange = () => {
      checkConsent();
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange);

    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
    };
  }, [gaId]);

  // Only render script if consent is given
  if (!shouldLoad) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization_signals: false,
            });
          `,
        }}
      />
    </>
  );
}

