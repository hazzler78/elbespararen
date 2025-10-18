"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface StickyCTAProps {
  onClick: () => void;
  text?: string;
}

export default function StickyCTA({ 
  onClick, 
  text = "Kontakta oss för att byta" 
}: StickyCTAProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [200, 400], [0, 1]);

  return (
    <motion.div
      style={{ opacity }}
      className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-border shadow-lg z-50"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="hidden sm:block">
          <p className="font-semibold">Redo att spara?</p>
          <p className="text-sm text-muted">Vi hjälper dig att byta leverantör.</p>
        </div>
        <button
          onClick={onClick}
          className="
            w-full sm:w-auto
            py-3 px-6 bg-secondary text-white font-semibold rounded-lg
            hover:bg-secondary/90 active:scale-[0.98]
            transition-all duration-200
            flex items-center justify-center gap-2
          "
        >
          {text}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

