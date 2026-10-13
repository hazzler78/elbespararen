import {
  filterSavableFees,
  stripNonSavableFees,
  stripUnverifiedElna,
  isSavableFee,
} from '../fee-classification';
import { applyCorrections } from '../ai-corrections';
import { calculateSavings } from '../calculations';
import { BillData } from '../types';

describe('fee-classification', () => {
  test('filtrerar bort nätavgifter och skatt', () => {
    const fees = [
      { label: 'Abonnemang', amount: 356, confidence: 0.9 },
      { label: 'Myndighetsavgift', amount: 9, confidence: 0.9 },
      { label: 'Energiskatt', amount: 120, confidence: 0.9 },
      { label: 'Fast påslag', amount: 86, confidence: 0.9 },
      { label: 'Månadsavgift', amount: 39.2, confidence: 0.9 },
    ];

    const kept = filterSavableFees(fees);
    expect(kept.map((f) => f.label)).toEqual(['Fast påslag', 'Månadsavgift']);
  });

  test('behåller fast påslag spot (Vattenfall)', () => {
    expect(
      isSavableFee({ label: 'Fast påslag spot', amount: 32.27, confidence: 0.9 })
    ).toBe(true);
  });

  test('tar bort Elna utan E.ON-kärnrader', () => {
    const bill: BillData = {
      elnatCost: 500,
      elhandelCost: 200,
      extraFeesTotal: 49,
      extraFeesDetailed: [{ label: 'E.ON Elna™', amount: 49, confidence: 0.9 }],
      totalKWh: 400,
      period: '2025-01',
      contractType: 'rörligt',
      confidence: 0.95,
      totalAmount: 749,
    };

    const result = stripUnverifiedElna(bill);
    expect(result.extraFeesDetailed).toHaveLength(0);
  });

  test('behåller Elna tillsammans med E.ON-kärnrader', () => {
    const bill: BillData = {
      elnatCost: 500,
      elhandelCost: 200,
      extraFeesTotal: 200,
      extraFeesDetailed: [
        { label: 'Rörliga kostnader', amount: 80, confidence: 0.9 },
        { label: 'Fast påslag', amount: 71, confidence: 0.9 },
        { label: 'E.ON Elna™', amount: 49, confidence: 0.9 },
      ],
      totalKWh: 400,
      period: '2025-01',
      contractType: 'rörligt',
      confidence: 0.95,
      totalAmount: 900,
    };

    const result = stripUnverifiedElna(bill);
    expect(result.extraFeesDetailed.some((f) => f.label.includes('Elna'))).toBe(true);
  });

  test('applyCorrections tar bort nätavgifter från känd fel-case', () => {
    const bill: BillData = {
      elnatCost: 800,
      elhandelCost: 400,
      extraFeesTotal: 490,
      extraFeesDetailed: [
        { label: 'Abonnemang', amount: 356, confidence: 0.9 },
        { label: 'Myndighetsavgift', amount: 9, confidence: 0.9 },
        { label: 'E.ON Elna™', amount: 49, confidence: 0.9 },
        { label: 'Rörliga kostnader', amount: 76, confidence: 0.9 },
        { label: 'Fast påslag', amount: 86, confidence: 0.9 },
      ],
      totalKWh: 500,
      period: '2025-01',
      contractType: 'rörligt',
      confidence: 0.95,
      totalAmount: 3172,
    };

    const corrected = applyCorrections(bill);
    const labels = corrected.extraFeesDetailed.map((f) => f.label);
    expect(labels).not.toContain('Abonnemang');
    expect(labels).not.toContain('Myndighetsavgift');
    expect(labels).toContain('Rörliga kostnader');
    expect(labels).toContain('Fast påslag');
    // Elna behålls när E.ON-kärna finns
    expect(labels.some((l) => l.includes('Elna'))).toBe(true);

    const savings = calculateSavings(corrected);
    // 76+86+49 = 211 * 1.25 = 263.75 ≈ 264
    expect(savings.potentialSavings).toBe(264);
  });

  test('stripNonSavableFees räknar om total', () => {
    const bill: BillData = {
      elnatCost: 100,
      elhandelCost: 100,
      extraFeesTotal: 400,
      extraFeesDetailed: [
        { label: 'Abonnemang', amount: 300, confidence: 0.9 },
        { label: 'Påslag', amount: 40, confidence: 0.9 },
      ],
      totalKWh: 200,
      period: '2025-01',
      contractType: 'fast',
      confidence: 0.9,
      totalAmount: 600,
    };

    const stripped = stripNonSavableFees(bill);
    expect(stripped.extraFeesTotal).toBe(40);
  });
});
