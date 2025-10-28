import * as React from 'react';

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
 * Gets optimized logo props for larger logos (like in "Bästa val" section)
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
