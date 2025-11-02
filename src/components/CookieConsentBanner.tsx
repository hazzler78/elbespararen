"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings } from 'lucide-react';
import Link from 'next/link';
import { hasGivenConsent, setCookieConsent } from '@/lib/cookie-consent';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    if (typeof window !== 'undefined') {
      const hasConsent = hasGivenConsent();
      setShowBanner(!hasConsent);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent(true);
    setShowBanner(false);
    // Trigger a custom event to notify analytics components to reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: { analytics: true } }));
    }
  };

  const handleReject = () => {
    setCookieConsent(false);
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Icon and Text */}
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 text-gray-900">
                    Vi använder cookies
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Vi använder cookies för att förbättra din upplevelse och analysera trafik. 
                    Genom att acceptera ger du ditt samtycke till att vi använder cookies för analytics (Google Analytics och Hotjar). 
                    <Link 
                      href="/cookies" 
                      className="text-primary hover:underline font-medium ml-1 inline-flex items-center gap-1"
                    >
                      Läs mer
                      <Settings className="w-3 h-3" />
                    </Link>
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                <button
                  onClick={handleReject}
                  className="
                    px-4 py-2 text-sm font-medium text-gray-700 
                    bg-white border border-gray-300 rounded-lg
                    hover:bg-gray-50 active:scale-[0.98]
                    transition-all duration-200
                  "
                >
                  Avvisa
                </button>
                <button
                  onClick={handleAccept}
                  className="
                    px-6 py-2 text-sm font-medium text-white
                    bg-primary rounded-lg
                    hover:bg-primary/90 active:scale-[0.98]
                    transition-all duration-200 shadow-md hover:shadow-lg
                  "
                >
                  Acceptera
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

