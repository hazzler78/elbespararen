/**
 * Klassificering av avgifter: vad som faktiskt går att spara bort genom att byta elhandlare.
 *
 * Elnät, skatter och basenergi (spot) är INTE sparbara.
 * Påslag, månadsavgifter hos elhandlare, tilläggstjänster och rabatter ÄR sparbara.
 */
import type { BillData, ExtraFeeDetailed } from './types';

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/™/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Elhandlar-avgifter som ska räknas som sparbara (även om ordet "abonnemang"/liknande förekommer). */
const SAVABLE_ALLOWLIST: RegExp[] = [
  /manadsavg/,
  /arsavgift/,
  /elavtal/,
  /fast\s*paslag/,
  /rorliga\s*kostnader/,
  /rorligt\s*paslag/,
  /^paslag$/,
  /\bpaslag\b/,
  /elcertifikat/,
  /priskollen/,
  /miljopaket/,
  /fossilfri/,
  /kampanjrabatt/,
  /rabatt/,
  /elna/, // E.ON Elna — tilläggstjänst (när den faktiskt finns på fakturan)
];

/**
 * Mönster för kostnader som INTE försvinner vid byte av elhandlare.
 * Ordning: mer specifika först.
 */
const NON_SAVABLE_PATTERNS: RegExp[] = [
  /\bmoms\b/,
  /\bvat\b/,
  /25\s*%/,
  /energiskatt/,
  /energi\s*skatt/,
  /medelspotpris/,
  /(?<!paslag\s)(?<!fast\s)spotpris/, // spotpris men inte "fast påslag spot"
  /eloverforing/,
  /el\s*overforing/,
  /oresutjamning/,
  /ore\s*utjamning/,
  /elnatsabonnemang/,
  /elnatsavgift/,
  /natabonnemang/,
  /natavgift/,
  /natkostnad/,
  /myndighetsavgift/,
  /elsakerhetsavgift/,
  /elberedskapsavgift/,
  /natovervakningsavgift/,
  /effektavgift/,
  /hoglast/,
  /sakringsavgift/,
  /overforingsavgift/,
  // Ensam "Abonnemang" / "Abonnemangsavgift" utan elhandelskontext = nästan alltid nät
  /^abonnemang$/,
  /^abonnemangsavgift$/,
  /^abonnemang\b(?!.*elavtal)/,
];

export function isSavableFee(fee: ExtraFeeDetailed): boolean {
  const label = normalizeLabel(fee.label || '');
  if (!label) return false;

  if (SAVABLE_ALLOWLIST.some((re) => re.test(label))) {
    return true;
  }

  if (NON_SAVABLE_PATTERNS.some((re) => re.test(label))) {
    return false;
  }

  // Okänd avgift: behåll (bättre visa än gömma), men höga runda nätliknande belopp
  // hanteras separat via applyCorrections / cap-regler.
  return true;
}

export function isNonSavableFee(fee: ExtraFeeDetailed): boolean {
  return !isSavableFee(fee);
}

export function filterSavableFees(fees: ExtraFeeDetailed[]): ExtraFeeDetailed[] {
  return fees.filter(isSavableFee);
}

export function sumFees(fees: ExtraFeeDetailed[]): number {
  return Math.round(fees.reduce((sum, fee) => sum + fee.amount, 0) * 100) / 100;
}

/**
 * Tar bort icke-sparbara avgifter från BillData och räknar om extraFeesTotal.
 */
export function stripNonSavableFees(billData: BillData): BillData {
  const kept = filterSavableFees(billData.extraFeesDetailed || []);
  const removed = (billData.extraFeesDetailed || []).filter(isNonSavableFee);

  if (removed.length > 0) {
    console.log(
      '[fee-classification] Tog bort icke-sparbara avgifter:',
      removed.map((f) => `${f.label} (${f.amount} kr)`).join(', ')
    );
  }

  return {
    ...billData,
    extraFeesDetailed: kept,
    extraFeesTotal: sumFees(kept),
  };
}

/**
 * E.ON Elna™ hallucineras ofta från prompt-exempel (49 kr).
 * Behåll endast när fakturan också har typiska E.ON elhandelsrader.
 */
export function stripUnverifiedElna(billData: BillData): BillData {
  const fees = billData.extraFeesDetailed || [];
  const hasEonCore =
    fees.some((f) => /rorliga\s*kostnader|rorligt\s*paslag/.test(normalizeLabel(f.label))) &&
    fees.some((f) => /fast\s*paslag/.test(normalizeLabel(f.label)) && !/spot/.test(normalizeLabel(f.label)));

  const kept = fees.filter((fee) => {
    const label = normalizeLabel(fee.label || '');
    if (!label.includes('elna')) return true;
    if (hasEonCore) return true;
    console.log('[fee-classification] Tar bort E.ON Elna™ utan E.ON-kärnrader (trolig hallucination)');
    return false;
  });

  if (kept.length === fees.length) return billData;

  return {
    ...billData,
    extraFeesDetailed: kept,
    extraFeesTotal: sumFees(kept),
  };
}
