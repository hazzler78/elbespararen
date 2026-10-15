"use client";

import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { buildSalesysEmbedUrl, type SalesysFormConfig } from "@/lib/salesys-forms";

interface SalesysEmbedModalProps {
  open: boolean;
  onClose: () => void;
  form: SalesysFormConfig;
  /** Affiliate URL used as SaleSys referrer for Elbespararen attribution */
  attributionReferrer?: string;
  /** Fallback if customer prefers the provider site */
  externalUrl?: string;
  providerName: string;
}

export default function SalesysEmbedModal({
  open,
  onClose,
  form,
  attributionReferrer,
  externalUrl,
  providerName,
}: SalesysEmbedModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const src = buildSalesysEmbedUrl(form.formId, attributionReferrer);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="salesys-embed-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-3xl sm:rounded-xl shadow-xl max-h-[95vh] flex flex-col rounded-t-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-200">
          <div>
            <h2 id="salesys-embed-title" className="text-lg font-bold text-gray-900">
              Byt till {providerName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Fyll i uppgifterna för att byta elavtal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden bg-gray-50">
          <iframe
            title={`Teckna avtal hos ${form.label}`}
            src={src}
            className="w-full h-[min(75vh,720px)] border-0 bg-white"
            allow="clipboard-write"
          />
        </div>

        {externalUrl && (
          <div className="p-3 border-t border-gray-200 text-center">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary"
            >
              Öppna hos {providerName} i stället
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
