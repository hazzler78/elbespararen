// Test för besparingsberäkningar

import { calculateSavings } from '../calculations';
import { BillData } from '../types';
import '@testing-library/jest-dom';

describe('calculateSavings', () => {
  // Testdata baserat på EON-fakturan
  const eonBillData: BillData = {
    elnatCost: 575.89,
    elhandelCost: 270.99,
    extraFeesTotal: 79.39,
    extraFeesDetailed: [
      { label: "Rörliga kostnader", amount: 17.53, confidence: 0.9 },
      { label: "Fast påslag", amount: 17.02, confidence: 0.9 },
      { label: "Elavtal årsavgift", amount: 44.84, confidence: 0.9 }
    ],
    totalKWh: 425,
    period: "2025-07-31 till 2025-08-31",
    contractType: "fast",
    confidence: 0.95,
    warnings: [],
    totalAmount: 1059.00 // "Belopp att betala" från fakturan
  };

  test('ska beräkna rätt besparing för EON-faktura', () => {
    const result = calculateSavings(eonBillData);

    // Nuvarande kostnad ska vara samma som "Belopp att betala" på fakturan
    expect(result.currentCost).toBe(1059);

    // Besparing = endast extra avgifter inkl. moms
    // Extra avgifter: 79.39 * 1.25 = 99.2375 kr ≈ 99 kr
    expect(result.potentialSavings).toBe(99);

    // Billigaste alternativ: 1059 - 99 = 960 kr
    expect(result.cheapestAlternative).toBe(960);

    // Besparing i procent: (99 / 1059) * 100 = 9.35% ≈ 9.4%
    expect(result.savingsPercentage).toBe(9.4);
  });

  test('ska hantera faktura utan extra avgifter', () => {
    const billWithoutExtraFees: BillData = {
      ...eonBillData,
      extraFeesTotal: 0,
      extraFeesDetailed: [],
      totalAmount: 846.88 // Bara elnät + elhandel
    };

    const result = calculateSavings(billWithoutExtraFees);

    expect(result.currentCost).toBe(847); // Rounded
    expect(result.potentialSavings).toBe(0); // Inga extra avgifter
    expect(result.cheapestAlternative).toBe(847); // 847 - 0
  });

  test('ska hantera faktura med dyrare elhandel än spotpris', () => {
    const expensiveElhandel: BillData = {
      ...eonBillData,
      elhandelCost: 400, // Dyrare än spotpris
      totalAmount: 1055.39 // 575.89 + 400 + 79.39
    };

    const result = calculateSavings(expensiveElhandel);

    expect(result.currentCost).toBe(1055);
    
    // Besparing = endast extra avgifter inkl. moms: 79.39 * 1.25 = 99.24 kr ≈ 99 kr
    expect(result.potentialSavings).toBe(99);
  });

  test('ska hantera faktura med billigare elhandel än spotpris', () => {
    const cheapElhandel: BillData = {
      ...eonBillData,
      elhandelCost: 200, // Billigare än spotpris
      totalAmount: 855.28 // 575.89 + 200 + 79.39
    };

    const result = calculateSavings(cheapElhandel);

    expect(result.currentCost).toBe(855);
    
    // Besparing = endast extra avgifter inkl. moms: 79.39 * 1.25 = 99.24 kr ≈ 99 kr
    expect(result.potentialSavings).toBe(99);
  });

  test('ska hantera olika förbrukningar', () => {
    const highConsumption: BillData = {
      ...eonBillData,
      totalKWh: 1000, // Hög förbrukning
      elhandelCost: 500, // 1000 kWh * 0.50 kr/kWh
      totalAmount: 1155.28 // 575.89 + 500 + 79.39
    };

    const result = calculateSavings(highConsumption);

    expect(result.currentCost).toBe(1155);
    
    // Besparing = endast extra avgifter inkl. moms: 79.39 * 1.25 = 99.24 kr ≈ 99 kr
    expect(result.potentialSavings).toBe(99);
  });

  test('ska hantera ny EON-faktura med fler extra avgifter', () => {
    const newEonBillData: BillData = {
      elnatCost: 2066.51, // E.ON Energidistribution AB
      elhandelCost: 1367.14, // Medelspotpris
      extraFeesTotal: 383.69, // 192.44 + 86.20 + 56.05 + 49.00
      extraFeesDetailed: [
        { label: "Rörliga kostnader", amount: 192.44, confidence: 0.9 },
        { label: "Fast påslag", amount: 86.20, confidence: 0.9 },
        { label: "Elavtal årsavgift", amount: 56.05, confidence: 0.9 },
        { label: "E.ON Elna™", amount: 49.00, confidence: 0.9 }
      ],
      totalKWh: 1724,
      period: "2025-01-01 till 2025-01-31",
      contractType: "rörligt",
      confidence: 0.95,
      warnings: [],
      totalAmount: 3817 // Belopp att betala
    };

    const result = calculateSavings(newEonBillData);

    expect(result.currentCost).toBe(3817);

    // Besparing = endast extra avgifter inkl. moms: 383.69 * 1.25 = 479.6125 kr ≈ 480 kr
    expect(result.potentialSavings).toBe(480);

    // Billigaste alternativ: 3817 - 480 = 3337 kr
    expect(result.cheapestAlternative).toBe(3337);

    // Besparing i procent: (480 / 3817) * 100 = 12.58% ≈ 12.6%
    expect(result.savingsPercentage).toBe(12.6);
  });
});