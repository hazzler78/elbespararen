"use client";

import { useMemo, useState } from "react";
import {
  getFallbackProviderLogo,
  resolveProviderLogo,
} from "@/lib/logo-utils";

type ProviderLogoProps = {
  name: string;
  logoUrl?: string;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  loading?: "lazy" | "eager";
};

function providerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export default function ProviderLogo({
  name,
  logoUrl,
  className = "",
  imageClassName = "h-12 w-auto object-contain max-w-[120px]",
  textClassName = "h-12 min-w-[3rem] px-2 flex items-center justify-center rounded-md border border-border bg-gray-50 text-xs font-semibold text-gray-700",
  loading = "lazy",
}: ProviderLogoProps) {
  const explicitSrc = useMemo(() => {
    const raw = (logoUrl || "").trim();
    if (!raw) return undefined;
    return resolveProviderLogo(name, raw);
  }, [name, logoUrl]);

  const fallbackSrc = useMemo(() => getFallbackProviderLogo(name), [name]);

  const [stage, setStage] = useState<"explicit" | "fallback" | "text">(
    explicitSrc ? "explicit" : "fallback"
  );

  const src =
    stage === "explicit"
      ? explicitSrc
      : stage === "fallback"
        ? fallbackSrc
        : undefined;

  if (stage === "text" || !src) {
    return (
      <div
        className={`${textClassName} ${className}`.trim()}
        title={name}
        aria-label={`${name} logotyp saknas`}
      >
        {providerInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logotyp`}
      className={`${imageClassName} ${className}`.trim()}
      loading={loading}
      onError={() => {
        if (stage === "explicit" && fallbackSrc && fallbackSrc !== explicitSrc) {
          setStage("fallback");
          return;
        }
        setStage("text");
      }}
      style={{
        imageRendering: "crisp-edges",
      }}
    />
  );
}
