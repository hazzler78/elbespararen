/**
 * SaleSys web-form IDs for in-page embed (skaffa.salesys.se).
 * Parent must handle iframe postMessage (redirect/resize) — see SalesysEmbedModal.
 * Attribution mirrors each brand's /teckna-elavtal page (?src=Elbespararen + Källa field).
 * Källa and Cookie field IDs are shared across these live forms.
 */

export const SALESYS_EMBED_ORIGIN = "https://skaffa.salesys.se";

/** Default Källa / affiliate channel name in SaleSys */
export const ELBESPARAREN_KALLA = "Elbespararen";

/** Shared across the partner forms (from each site's embed script). */
const KALLA_FIELD_ID = "66e9452c20ef2d3b8c66f4fc";
const COOKIE_FIELD_ID = "693c095ee03b5aceecefd87a";

export type SalesysFormConfig = {
  formId: string;
  /** Shown above the form */
  label: string;
  /** SaleSys field id for Källa (channel attribution) */
  kallaFieldId?: string;
  /** SaleSys field id that receives document.cookie for CAPI / tracking */
  cookieFieldId?: string;
  /**
   * Brand signup page. Used as SaleSys referrer when the provider has no
   * affiliate URL, and as the "open on the provider site" fallback.
   */
  signupUrl?: string;
};

export type SalesysFieldRef = { fieldId: string; value: string };

function salesysForm(
  formId: string,
  label: string,
  signupUrl: string
): SalesysFormConfig {
  return {
    formId,
    label,
    signupUrl,
    kallaFieldId: KALLA_FIELD_ID,
    cookieFieldId: COOKIE_FIELD_ID,
  };
}

const CHEAP_ENERGY = salesysForm(
  "68ab2b2a4d638f9c685d2877",
  "Cheap Energy",
  "https://www.cheapenergy.se/teckna-elavtal/?src=Elbespararen"
);
const STOCKHOLM = salesysForm(
  "68ab2b084d638f9c685d27ac",
  "Stockholms Elbolag",
  "https://www.stockholmselbolag.se/teckna-elavtal/?src=Elbespararen"
);
const SVEALAND = salesysForm(
  "68ab2af84d638f9c685d2768",
  "Svealands Elbolag",
  "https://www.svealandselbolag.se/teckna-elavtal/?src=Elbespararen"
);
const ENERGI2 = salesysForm(
  "68ab2b3e4d638f9c685d2942",
  "Energi2",
  "https://energi2.se/teckna-elavtal/?src=Elbespararen"
);
const SVEKRAFT = salesysForm(
  "68ab2b1e4d638f9c685d2833",
  "Svekraft",
  "https://svekraft.com/teckna-elavtal/?src=Elbespararen"
);
const MOTALA = salesysForm(
  "68ab2b344d638f9c685d28f8",
  "Motala Energi",
  "https://motalaenergi.se/teckna-elavtal/?src=Elbespararen"
);

/**
 * First match wins. Svekraft is listed before Svea so a broad "svea" rule
 * cannot claim Svekraft.
 */
const PROVIDER_MATCHERS: Array<{
  matches: (normalizedName: string) => boolean;
  form: SalesysFormConfig;
}> = [
  { matches: (name) => name.includes("cheap energy"), form: CHEAP_ENERGY },
  {
    matches: (name) => name.includes("stockholm") || name.includes("sthlm"),
    form: STOCKHOLM,
  },
  { matches: (name) => name.includes("svekraft"), form: SVEKRAFT },
  {
    matches: (name) => name.includes("energi2") || name.includes("energi 2"),
    form: ENERGI2,
  },
  { matches: (name) => name.includes("motala"), form: MOTALA },
  {
    matches: (name) =>
      name.includes("svealand") || name === "svea" || name.startsWith("svea "),
    form: SVEALAND,
  },
];

function normalizeProviderName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function getSalesysFormForProvider(
  providerName: string
): SalesysFormConfig | null {
  const key = normalizeProviderName(providerName);
  if (!key) return null;
  return PROVIDER_MATCHERS.find((entry) => entry.matches(key))?.form ?? null;
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

/** Fields to push into the iframe via postMessage setFields (same as the brand sites). */
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
 * Iframe URL that preserves Elbespararen attribution the same way the brand
 * signup pages do (referrer contains src=Elbespararen).
 */
export function buildSalesysEmbedUrl(
  formId: string,
  attributionReferrer?: string,
  fallbackReferrer?: string
): string {
  const referrer =
    (attributionReferrer && attributionReferrer.trim()) ||
    fallbackReferrer ||
    CHEAP_ENERGY.signupUrl ||
    "";
  const params = new URLSearchParams({
    referrer,
    t: String(Date.now()),
  });
  return `${SALESYS_EMBED_ORIGIN}/${formId}?${params.toString()}`;
}
