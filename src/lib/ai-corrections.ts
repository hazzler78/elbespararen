// AI Correction System - Korrigerar vanliga AI-fel
import { BillData } from './types';
import {
  stripNonSavableFees,
  stripUnverifiedElna,
  sumFees,
  isNonSavableFee,
} from './fee-classification';

export interface CorrectionRule {
  name: string;
  condition: (data: BillData) => boolean;
  correction: (data: BillData) => BillData;
  description: string;
}

export const CORRECTION_RULES: CorrectionRule[] = [
  {
    name: 'remove-unknown-fees',
    description: 'Tar bort avgifter utan label eller med okänd label',
    condition: (data) =>
      (data.extraFeesDetailed || []).some(
        (fee) =>
          !fee.label ||
          fee.label.trim() === '' ||
          fee.label.toLowerCase().includes('okänd') ||
          fee.label.toLowerCase().includes('unknown')
      ),
    correction: (data) => {
      const filtered = (data.extraFeesDetailed || []).filter(
        (fee) =>
          fee.label &&
          fee.label.trim() !== '' &&
          !fee.label.toLowerCase().includes('okänd') &&
          !fee.label.toLowerCase().includes('unknown')
      );
      return {
        ...data,
        extraFeesDetailed: filtered,
        extraFeesTotal: sumFees(filtered),
      };
    },
  },
  {
    name: 'remove-other-provider-fees',
    description:
      'Tar bort leverantörsspecifika avgifter (t.ex. E.ON Elna™) när fakturan inte matchar leverantören',
    condition: (data) =>
      (data.extraFeesDetailed || []).some((fee) => {
        const label = fee.label.toLowerCase();
        if (label.includes('elna') || label.includes('e.ons') || label.includes('eon ')) {
          const hasRoerliga = (data.extraFeesDetailed || []).some((f) =>
            f.label.toLowerCase().includes('rörliga kostnader')
          );
          const hasFastPaaslag = (data.extraFeesDetailed || []).some((f) => {
            const l = f.label.toLowerCase();
            return l.includes('fast påslag') && !l.includes('spot');
          });
          return !(hasRoerliga && hasFastPaaslag);
        }
        return false;
      }),
    correction: (data) => {
      const fees = data.extraFeesDetailed || [];
      const hasRoerliga = fees.some((f) =>
        f.label.toLowerCase().includes('rörliga kostnader')
      );
      const hasFastPaaslag = fees.some((f) => {
        const l = f.label.toLowerCase();
        return l.includes('fast påslag') && !l.includes('spot');
      });
      const isLikelyEon = hasRoerliga && hasFastPaaslag;

      const filtered = fees.filter((fee) => {
        const label = fee.label.toLowerCase();
        if (label.includes('elna')) {
          if (!isLikelyEon) {
            console.log(
              '[AI Corrections] Tar bort E.ON Elna från faktura som inte verkar vara från E.ON'
            );
            return false;
          }
        }
        return true;
      });

      return {
        ...data,
        extraFeesDetailed: filtered,
        extraFeesTotal: sumFees(filtered),
      };
    },
  },
  {
    name: 'detect-missing-fees',
    description: 'Identifierar när AI:n kan ha missat viktiga avgifter',
    condition: (data) => {
      const expectedTotal = data.elnatCost + data.elhandelCost + data.extraFeesTotal;
      return Math.abs(data.totalAmount - expectedTotal) > 100;
    },
    correction: (data) => {
      console.log(
        '[AI Corrections] VARNING: Stor skillnad mellan förväntat och faktiskt belopp. AI:n kan ha missat viktiga avgifter.'
      );
      console.log(
        `[AI Corrections] Förväntat: ${data.elnatCost + data.elhandelCost + data.extraFeesTotal} kr, Faktiskt: ${data.totalAmount} kr`
      );
      return data;
    },
  },
  {
    name: 'cap-extra-fees-to-total',
    description: 'Varnar och kapar om extra avgifter överstiger totalAmount (misskategorisering)',
    condition: (data) => {
      const calculatedTotal = sumFees(data.extraFeesDetailed || []);
      return calculatedTotal > data.totalAmount * 0.8;
    },
    correction: (data) => {
      const fees = data.extraFeesDetailed || [];
      const calculatedTotal = sumFees(fees);
      if (calculatedTotal <= data.totalAmount) return data;

      console.warn(
        `[AI Corrections] Extra avgifter (${calculatedTotal} kr) överstiger totalAmount (${data.totalAmount} kr).`
      );
      const maxExtraFees = data.totalAmount * 0.5;
      const sortedFees = [...fees].sort((a, b) => b.amount - a.amount);
      const keptFees: typeof data.extraFeesDetailed = [];
      let runningTotal = 0;

      for (const fee of sortedFees) {
        if (runningTotal + fee.amount <= maxExtraFees) {
          keptFees.push(fee);
          runningTotal += fee.amount;
        }
      }

      return {
        ...data,
        extraFeesDetailed: keptFees,
        extraFeesTotal: sumFees(keptFees),
        warnings: [
          ...(data.warnings || []),
          `Extra avgifter reducerades från ${calculatedTotal} kr till ${sumFees(keptFees)} kr p.g.a. misskategorisering`,
        ],
      };
    },
  },
];

export function applyCorrections(billData: BillData): BillData {
  // 1) Ta bort nät/skatt/spot m.m. — viktigaste filtret för korrekt besparing
  let correctedData = stripNonSavableFees(billData);
  // 2) Elna utan E.ON-kärnrader = typisk hallucination
  correctedData = stripUnverifiedElna(correctedData);

  const appliedCorrections: string[] = ['strip-non-savable', 'strip-unverified-elna'];

  for (const rule of CORRECTION_RULES) {
    if (rule.condition(correctedData)) {
      correctedData = rule.correction(correctedData);
      appliedCorrections.push(rule.name);
      console.log(`[AI Corrections] Applied rule: ${rule.description}`);
    }
  }

  // Säkerställ att total alltid matchar kvarvarande rader
  correctedData = {
    ...correctedData,
    extraFeesTotal: sumFees(correctedData.extraFeesDetailed || []),
  };

  console.log(`[AI Corrections] Applied ${appliedCorrections.length} steps:`, appliedCorrections);
  return correctedData;
}

export function validateBillData(billData: BillData): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  for (const fee of billData.extraFeesDetailed || []) {
    if (isNonSavableFee(fee)) {
      warnings.push(`Extra avgift innehåller icke-sparbar term: ${fee.label}`);
    }
  }

  const calculatedTotal = sumFees(billData.extraFeesDetailed || []);
  if (Math.abs(calculatedTotal - billData.extraFeesTotal) > 0.01) {
    warnings.push(
      `Extra avgifter summerar inte korrekt: ${calculatedTotal} vs ${billData.extraFeesTotal}`
    );
  }

  if (billData.totalAmount < 100 || billData.totalAmount > 10000) {
    warnings.push(`Total belopp verkar orimligt: ${billData.totalAmount} kr`);
  }

  const expectedTotal = billData.elnatCost + billData.elhandelCost + billData.extraFeesTotal;
  const amountDifference = Math.abs(billData.totalAmount - expectedTotal);
  if (amountDifference > 100) {
    warnings.push(
      `Stor skillnad mellan förväntat och faktiskt belopp: ${amountDifference} kr. AI:n kan ha missat viktiga avgifter.`
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
