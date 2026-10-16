"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink } from "lucide-react";
import {
  buildSalesysAttributionFields,
  buildSalesysEmbedUrl,
  SALESYS_EMBED_ORIGIN,
  type SalesysFormConfig,
} from "@/lib/salesys-forms";

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

const DEFAULT_IFRAME_HEIGHT = 640;
/** Sanity cap only — never clip to viewport (that breaks mobile scroll). */
const MAX_IFRAME_HEIGHT = 8000;

/**
 * SaleSys iframe expects the parent to handle postMessage (see salesys.se/scripts/web_form1.js).
 * Official createWebForm sets iframe height to the FULL reported height (no viewport cap)
 * and scrolls the page on stepChanged.
 *
 * Important for mobile (Chrome/Android):
 * - Do NOT cap iframe height to ~85vh. A short iframe + tall SaleSys form clips
 *   rörligt/fastpris options, and touch events stay trapped in the iframe so the
 *   modal cannot scroll either.
 * - Grow iframe to content height; let this modal's overflow container scroll.
 *   When iframe height === content height, scroll chaining reaches the parent.
 *
 * Do NOT call scrollIntoView on the iframe: this modal is often mounted under #byt-avtal
 * at the bottom of a long page, and scrollIntoView jumps the window there on every step.
 */
export default function SalesysEmbedModal({
  open,
  onClose,
  form,
  attributionReferrer,
  externalUrl,
  providerName,
}: SalesysEmbedModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [iframeHeight, setIframeHeight] = useState(DEFAULT_IFRAME_HEIGHT);
  const [mounted, setMounted] = useState(false);
  const [embedSrc] = useState(() =>
    buildSalesysEmbedUrl(form.formId, attributionReferrer)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const pushAttributionFields = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const fields = buildSalesysAttributionFields(form, attributionReferrer);
    if (fields.length === 0) return;
    win.postMessage({ type: "setFields", references: fields }, SALESYS_EMBED_ORIGIN);
  }, [form, attributionReferrer]);

  const resetModalScroll = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // position:fixed lock is more reliable than overflow:hidden alone on Android Chrome
    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      htmlOverflow: documentElement.style.overflow,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      documentElement.style.overflow = prev.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== SALESYS_EMBED_ORIGIN) return;
      if (event.source !== iframeRef.current?.contentWindow) return;

      const data = event.data;
      if (!data || typeof data !== "object" || !("type" in data)) return;

      switch (data.type) {
        case "resize": {
          // Match salesys.se/scripts/web_form1.js — full height, no viewport clamp.
          const height = Number((data as { height?: number }).height);
          if (Number.isFinite(height) && height > 0) {
            setIframeHeight(
              Math.min(Math.max(Math.round(height + 24), DEFAULT_IFRAME_HEIGHT), MAX_IFRAME_HEIGHT)
            );
          }
          break;
        }
        case "redirect": {
          const url = (data as { url?: string }).url;
          if (!url) break;
          window.location.assign(url);
          break;
        }
        case "stepChanged": {
          // Scroll only inside the modal — never the page under #byt-avtal.
          resetModalScroll();
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open, resetModalScroll]);

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="salesys-embed-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-3xl sm:rounded-xl shadow-xl h-[100dvh] sm:h-auto sm:max-h-[95vh] flex flex-col rounded-t-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-200 flex-shrink-0">
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

        {/*
          Parent scrolls the full-height iframe. Cap was removed so SaleSys
          rörligt/fastpris steps are reachable via touch scroll chaining.
        */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y bg-gray-50"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <iframe
            ref={iframeRef}
            title={`Teckna avtal hos ${form.label}`}
            src={embedSrc}
            onLoad={pushAttributionFields}
            style={{ height: iframeHeight }}
            className="w-full border-0 bg-white block"
            allow="clipboard-write"
          />
        </div>

        {externalUrl && (
          <div className="p-3 border-t border-gray-200 text-center flex-shrink-0">
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

  return createPortal(modal, document.body);
}
