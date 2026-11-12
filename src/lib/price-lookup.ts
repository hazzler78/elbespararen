import { markupKrInclVatToOreExcl, markupOreExclToKrInclVat } from "@/lib/variable-markup";

export { markupKrInclVatToOreExcl };

export type PriceLookupSource = "live" | "cache" | "database" | "unknown";

export function hasUsableLookupMarkup(data: {
  source?: string;
  surcharge?: number;
}): boolean {
  const source = data.source as PriceLookupSource | undefined;
  if (source === "unknown" || source === undefined) return false;
  return typeof data.surcharge === "number" && Number.isFinite(data.surcharge);
}

/** Verifierar att db-påslag och visat kr-värde är inverserbara (inom flyttalsfel). */
export function markupKrMatchesOreExcl(krInclVat: number, oreExcl: number): boolean {
  return Math.abs(markupOreExclToKrInclVat(oreExcl) - krInclVat) < 1e-6;
}
