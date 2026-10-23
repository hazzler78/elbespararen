"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { mergeStoredUtmIntoUrl, storeUtmFromUrl } from "@/lib/utm-passthrough";

/**
 * Captures UTM tags from the landing URL and appends them to same-origin
 * in-app link navigations when missing (helps CF Web Analytics + GA attribution).
 */
export default function UtmPassthrough() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = new URL(window.location.href);
    storeUtmFromUrl(url);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(rawHref, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const merged = mergeStoredUtmIntoUrl(url);
      const before = url.pathname + url.search + url.hash;
      const after = merged.pathname + merged.search + merged.hash;
      if (before === after) return;

      event.preventDefault();
      window.location.assign(after);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
