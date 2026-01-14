import * as React from 'react';

/**
 * Converts provider names to a standardized kebab-case slug.
 */
export function providerNameToSlug(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Mapping of provider names to their logo filenames.
 * This ensures correct logo mapping even when names don't match slug conversion.
 */
const PROVIDER_LOGO_MAP: Record<string, string> = {
  'Cheap Energy': 'cheap-energy',
  'Svekraft': 'svekraft',
  'Bixia': 'bixia',
  'Dalakraft': 'dalakraft',
  'Ellevio': 'ellevio',
  'Energi2': 'energi2',
  'Eon': 'eon',
  'Fortum': 'fortum',
  'Green Power': 'green_power', // Note: underscore, not hyphen
  'Greenely': 'greenely',
  'Motala Energi': 'motala-el', // Note: "el" not "energi"
  'Skellefteå Kraft': 'skelleftea', // Note: no "-kraft"
  'Stockholms Elbolag': 'stockholms-elbolag',
  'Svealands Elbolag': 'svealands-elbolag',
  'Telinet Energi': 'telinet', // Note: no "-energi"
  'Tibber': 'tibber',
  'Vattenfall': 'vattenfall',
};

/**
 * Returns the default fallback logo path for a given provider name.
 * Uses explicit mapping if available, otherwise falls back to slug conversion.
 */
export function getFallbackProviderLogo(name: string): string {
  const normalizedName = name.trim();
  
  // Case-insensitive lookup in the mapping
  const mappingKey = Object.keys(PROVIDER_LOGO_MAP).find(
    key => key.toLowerCase() === normalizedName.toLowerCase()
  );
  
  if (mappingKey) {
    return `/logos/${PROVIDER_LOGO_MAP[mappingKey]}.svg`;
  }
  
  // Fallback to slug conversion
  return `/logos/${providerNameToSlug(name)}.svg`;
}

/**
 * Resolves the most suitable logo URL given an explicit value and provider name.
 * - Absolute URLs are returned untouched.
 * - Relative paths (starting with "/") are respected.
 * - Bare filenames get `/logos/` prefix and `.svg` appended if missing.
 * - No value falls back to the derived `/logos/{slug}.svg`.
 */
export function resolveProviderLogo(name: string, logoUrl?: string): string {
  const raw = (logoUrl || "").trim();
  if (raw) {
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/")) return raw;
    const withFolder = `/logos/${raw}`;
    return /\.[a-zA-Z0-9]+$/.test(withFolder) ? withFolder : `${withFolder}.svg`;
  }
  return getFallbackProviderLogo(name);
}

/**
 * Creates a reusable error handler that swaps to the fallback logo when the image fails.
 */
export function createProviderLogoErrorHandler(name: string) {
  const fallback = getFallbackProviderLogo(name);
  return (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (img.src.endsWith(fallback)) return;
    img.src = fallback;
  };
}

/**
 * Logo utility functions for better image quality and rendering
 */

/**
 * Optimizes logo URL for better quality rendering
 * @param logoUrl - The original logo URL
 * @returns Optimized logo URL with quality parameters
 */
export function optimizeLogoUrl(logoUrl: string): string {
  if (!logoUrl) return logoUrl;
  
  // If it's an SVG, return as-is since it's already vector
  if (logoUrl.endsWith('.svg')) {
    return logoUrl;
  }
  
  // For other image formats, we could add quality parameters
  // For now, return as-is but this could be extended for CDN optimization
  return logoUrl;
}

/**
 * Gets optimized logo props for better rendering
 * @param logoUrl - The logo URL
 * @param alt - Alt text for the image
 * @param className - CSS classes
 * @returns Optimized props object
 */
export function getOptimizedLogoProps(
  logoUrl: string, 
  alt: string, 
  className: string = "h-12 w-auto object-contain"
) {
  return {
    src: optimizeLogoUrl(logoUrl),
    alt,
    className: `${className} max-w-[120px]`,
    style: {
      imageRendering: 'crisp-edges' as const,
      WebkitImageRendering: 'crisp-edges' as const,
    } as React.CSSProperties,
    loading: 'lazy' as const,
  };
}

/**
 * Gets optimized logo props for larger logos (like in "Mest populär" section)
 * @param logoUrl - The logo URL
 * @param alt - Alt text for the image
 * @param className - CSS classes
 * @returns Optimized props object
 */
export function getOptimizedLargeLogoProps(
  logoUrl: string, 
  alt: string, 
  className: string = "h-20 w-auto object-contain"
) {
  return {
    src: optimizeLogoUrl(logoUrl),
    alt,
    className: `${className} max-w-[160px]`,
    style: {
      imageRendering: 'crisp-edges' as const,
      WebkitImageRendering: 'crisp-edges' as const,
    } as React.CSSProperties,
    loading: 'lazy' as const,
  };
}
