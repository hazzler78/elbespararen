"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { hasAnalyticsConsent } from '@/lib/cookie-consent';

/**
 * TikTok Pixel Component
 * Only loads TikTok Pixel script if:
 * 1. NEXT_PUBLIC_ENABLE_ANALYTICS is true
 * 2. NEXT_PUBLIC_TIKTOK_PIXEL_ID is set (or uses default)
 * 3. User has given analytics consent
 */
export default function TikTokPixel() {
  // Use environment variable or default to the provided pixel ID
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'D4K2SFBC77U7MI8IKM8G';
  const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Don't load if analytics is disabled
  if (!analyticsEnabled) {
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
  }, [pixelId]);

  // Only render script if consent is given
  if (!shouldLoad) {
    return null;
  }

  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load('${pixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `,
      }}
    />
  );
}


