/**
 * SaleSys web-form IDs for in-page embed (skaffa.salesys.se).
 * Attribution: referrer mimics ?src=Elbespararen so orders land on Elbespararen channels.
 */

export type SalesysFormConfig = {
  formId: string;
  /** Shown above the form */
  label: string;
};

/** Provider display-name (case-insensitive match) → SaleSys form */
const FORMS_BY_PROVIDER: Record<string, SalesysFormConfig> = {
  // Live form used on cheapenergy.se/teckna-elavtal (verified resources API 200)
  "cheap energy": {
    formId: "68ab2b2a4d638f9c685d2877",
    label: "Cheap Energy",
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
  return `https://skaffa.salesys.se/${formId}?${params.toString()}`;
}
