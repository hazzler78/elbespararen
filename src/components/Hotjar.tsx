"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { hasAnalyticsConsent } from '@/lib/cookie-consent';

/**
 * Hotjar Tracking Component
 * Only loads Hotjar script if:
 * 1. NEXT_PUBLIC_ENABLE_ANALYTICS is true
 * 2. NEXT_PUBLIC_HOTJAR_ID is set
 * 3. User has given analytics consent
 */
export default function Hotjar() {
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Don't load if disabled or no ID
  if (!analyticsEnabled || !hotjarId) {
    return null;
  }

  useEffect(() => {
    // Check consent on client side only
    if (typeof window !== 'undefined') {
      const hasConsent = hasAnalyticsConsent();
      setShouldLoad(hasConsent);
    }
  }, []);

  // Only render script if consent is given
  if (!shouldLoad) {
    return null;
  }

  return (
    <Script
      id="hotjar-tracking"
      strategy="afterInteractive"
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

