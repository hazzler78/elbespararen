"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { hasAnalyticsConsent } from '@/lib/cookie-consent';

/**
 * Hotjar Tracking Component
 * Only loads Hotjar script if:
 * 1. NEXT_PUBLIC_ENABLE_ANALYTICS is true
 * 2. NEXT_PUBLIC_HOTJAR_ID is set
 * 3. User has given analytics consent (or NEXT_PUBLIC_HOTJAR_SKIP_CONSENT is true for testing)
 */
export default function Hotjar() {
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  const skipConsent = process.env.NEXT_PUBLIC_HOTJAR_SKIP_CONSENT === 'true';
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Don't load if disabled or no ID
  if (!analyticsEnabled || !hotjarId) {
    // Log why Hotjar is not loading
    if (typeof window !== 'undefined') {
      console.warn('[Hotjar] Not loading - Analytics enabled:', analyticsEnabled, 'Hotjar ID:', hotjarId);
    }
    return null;
  }

  useEffect(() => {
    // Check consent on client side only
    const checkConsent = () => {
      if (typeof window !== 'undefined') {
        // Allow loading if consent is given OR if skipConsent is enabled (for testing/verification)
        const hasConsent = skipConsent || hasAnalyticsConsent();
        
        // Debug logging (always show to help diagnose issues)
        console.log('[Hotjar] Analytics enabled:', analyticsEnabled);
        console.log('[Hotjar] Hotjar ID:', hotjarId);
        console.log('[Hotjar] Skip consent:', skipConsent);
        console.log('[Hotjar] Has consent:', hasAnalyticsConsent());
        console.log('[Hotjar] Will load:', hasConsent);
        
        setShouldLoad(hasConsent);
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
  }, [skipConsent, analyticsEnabled, hotjarId]);

  // Only render script if should load
  if (!shouldLoad) {
    return null;
  }

  return (
    <Script
      id="hotjar-tracking"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('[Hotjar] Script loaded successfully');
        // Verify Hotjar is available
        setTimeout(() => {
          if ((window as any).hj) {
            console.log('[Hotjar] Hotjar initialized:', (window as any).hj);
          } else {
            console.warn('[Hotjar] Hotjar script loaded but window.hj not found');
          }
        }, 1000);
      }}
      onError={(e) => {
        console.error('[Hotjar] Failed to load script:', e);
      }}
      dangerouslySetInnerHTML={{
        __html: `
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${hotjarId},hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `,
      }}
    />
  );
}

