/**
 * Rörliga avtal jämförs på leverantörens påslag, inte på hela tillägget ovanpå spot.
 * Påslag, rörliga kostnader och rabatt kommer från källan i öre/kWh exkl. moms.
 * energyPrice i databasen är påslaget i kr/kWh inkl. moms.
 */

export function markupOreExclToKrInclVat(markupOreExcl: number): number {
  if (!Number.isFinite(markupOreExcl)) return 0;
  return Number(((markupOreExcl / 100) * 1.25).toFixed(6));
}

/** Omvandling från admin/databas (kr/kWh inkl. moms) till lookup-format (öre/kWh exkl. moms). */
export function markupKrInclVatToOreExcl(krInclVat: number): number {
  if (!Number.isFinite(krInclVat)) return 0;
  return Number(((krInclVat / 1.25) * 100).toFixed(6));
}

/** Hela kWh-tillägget för en kostnadsuppskattning: påslag + rörliga kostnader + certifikat + rabatt. */
export function fullEnergyAdderKrInclVat(parts: {
  markupOreExcl?: number;
  variableCostsOreExcl?: number;
  certificateOreExcl?: number;
  /** Redan tecknad: negativ rabatt sänker tillägget. */
  discountOreExcl?: number;
}): number {
  const ore =
    (Number.isFinite(parts.markupOreExcl) ? parts.markupOreExcl! : 0) +
    (Number.isFinite(parts.variableCostsOreExcl) ? parts.variableCostsOreExcl! : 0) +
    (Number.isFinite(parts.certificateOreExcl) ? parts.certificateOreExcl! : 0) +
    (Number.isFinite(parts.discountOreExcl) ? parts.discountOreExcl! : 0);
  return markupOreExclToKrInclVat(ore);
}
