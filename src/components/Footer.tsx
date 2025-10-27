"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FooterSection {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
}

const footerSections: FooterSection[] = [
  {
    title: "Om oss",
    links: [
      { label: "Om oss", href: "/about" },
      { label: "Kontakt", href: "/contact" }
    ]
  },
  {
    title: "Vanliga frågor",
    links: [
      { label: "FAQ", href: "/faq" }
    ]
  },
  {
    title: "Juridiskt",
    links: [
      { label: "Integritet & villkor", href: "/privacy" },
      { label: "Cookies & GDPR", href: "/cookies" }
    ]
  }
];

export default function Footer() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  // IntersectionObserver för fade-in effekt
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleSection = (title: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <motion.footer
      ref={footerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-gray-900 text-white"
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Mobile Layout - Accordion */}
        <div className="md:hidden">
          {footerSections.map((section, index) => (
            <div key={section.title} className="border-b border-gray-700 last:border-b-0">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between py-4 text-left hover:text-primary transition-colors duration-300"
                aria-expanded={openSections.has(section.title)}
              >
                <span className="font-semibold text-lg">{section.title}</span>
                <motion.div
                  animate={{ rotate: openSections.has(section.title) ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {openSections.has(section.title) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openSections.has(section.title) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pb-4 space-y-3">
                      {section.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          className="block py-2 text-gray-300 hover:text-primary transition-colors duration-300 min-h-[44px] flex items-center"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Desktop Layout - Two Column Grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-8">
          <div className="space-y-8">
            {footerSections.slice(0, 2).map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-lg mb-4 text-white">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-primary transition-colors duration-300 block py-2 min-h-[44px] flex items-center"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="space-y-8">
            {footerSections.slice(2).map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-lg mb-4 text-white">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-primary transition-colors duration-300 block py-2 min-h-[44px] flex items-center"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          {/* Copyright */}
          <div className="text-center">
            <p className="text-gray-400 text-sm leading-relaxed">
              © 2025 Elbespararen. En AI-driven elfaktura-analys. Byggd med ❤️ för att göra elmarknaden mer transparent.
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
