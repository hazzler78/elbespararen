/**
 * SaleSys web-form IDs for in-page embed (skaffa.salesys.se).
 * Parent must handle iframe postMessage (redirect/resize) — see SalesysEmbedModal.
 * Attribution mirrors cheapenergy.se/teckna-elavtal (?src=Elbespararen + Källa field).
 */

export const SALESYS_EMBED_ORIGIN = "https://skaffa.salesys.se";

/** Default Källa / affiliate channel name in SaleSys */
export const ELBESPARAREN_KALLA = "Elbespararen";

export type SalesysFormConfig = {
  formId: string;
  /** Shown above the form */
  label: string;
  /** SaleSys field id for Källa (channel attribution) */
  kallaFieldId?: string;
  /** SaleSys field id that receives document.cookie for CAPI / tracking */
  cookieFieldId?: string;
};

export type SalesysFieldRef = { fieldId: string; value: string };

/** Provider display-name (case-insensitive match) → SaleSys form */
const FORMS_BY_PROVIDER: Record<string, SalesysFormConfig> = {
  // Live form used on cheapenergy.se/teckna-elavtal (field IDs from their embed script)
  "cheap energy": {
    formId: "68ab2b2a4d638f9c685d2877",
    label: "Cheap Energy",
    kallaFieldId: "66e9452c20ef2d3b8c66f4fc",
    cookieFieldId: "693c095ee03b5aceecefd87a",
  },
};

function normalizeProviderName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function getSalesysFormForProvider(
  providerName: string
): SalesysFormConfig | null {
  const key = normalizeProviderName(providerName);
  if (FORMS_BY_PROVIDER[key]) return FORMS_BY_PROVIDER[key];
  // Partial match (e.g. "Cheap Energy Rörligt")
  for (const [name, config] of Object.entries(FORMS_BY_PROVIDER)) {
    if (key.includes(name) || name.includes(key)) return config;
  }
  return null;
}

/**
 * Prefer ?src= from affiliate/referrer URL, else Elbespararen.
 */
export function resolveSalesysKalla(attributionReferrer?: string): string {
  if (!attributionReferrer) return ELBESPARAREN_KALLA;
  try {
    const src = new URL(attributionReferrer).searchParams.get("src");
    if (src && src.trim()) return src.trim();
  } catch {
    // ignore invalid URL
  }
  return ELBESPARAREN_KALLA;
}

/** Fields to push into the iframe via postMessage setFields (same as cheapenergy.se). */
export function buildSalesysAttributionFields(
  form: SalesysFormConfig,
  attributionReferrer?: string
): SalesysFieldRef[] {
  const fields: SalesysFieldRef[] = [];
  if (form.kallaFieldId) {
    fields.push({
      fieldId: form.kallaFieldId,
      value: resolveSalesysKalla(attributionReferrer),
    });
  }
  if (form.cookieFieldId && typeof document !== "undefined" && document.cookie) {
    fields.push({
      fieldId: form.cookieFieldId,
      value: document.cookie,
    });
  }
  return fields;
}

/**
 * Iframe URL that preserves Elbespararen attribution the same way
 * cheapenergy.se does (referrer contains src=Elbespararen).
 */
export function buildSalesysEmbedUrl(
  formId: string,
  attributionReferrer?: string
): string {
  const referrer =
    attributionReferrer ||
    "https://www.cheapenergy.se/teckna-elavtal/?src=Elbespararen";
  const params = new URLSearchParams({
    referrer,
    t: String(Date.now()),
  });
  return `${SALESYS_EMBED_ORIGIN}/${formId}?${params.toString()}`;
}
