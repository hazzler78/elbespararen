import { calculateSavings, formatCurrency, getConfidenceColor, getConfidenceLabel } from '../calculations';
import { BillData } from '../types';

describe('calculateSavings', () => {
  it('should calculate savings correctly', () => {
    const billData: BillData = {
      elnatCost: 500,
      elhandelCost: 700,
      extraFeesTotal: 100,
      extraFeesDetailed: [
        { label: 'Påslag', amount: 50, confidence: 0.9 },
        { label: 'Årsavgift', amount: 50, confidence: 0.95 }
      ],
      totalKWh: 500,
      period: 'Jan 2025',
      contractType: 'rörligt',
      confidence: 0.92
    };

    const savings = calculateSavings(billData);

    // Billigaste: 500 (elnät) + (500 * 0.50 + 29) = 500 + 279 = 779
    // Nuvarande: 500 + 700 + 100 = 1300
    // Besparing: 1300 - 779 = 521
    expect(savings.currentCost).toBe(1300);
    expect(savings.cheapestAlternative).toBe(779);
    expect(savings.potentialSavings).toBe(521);
    expect(savings.savingsPercentage).toBeCloseTo(40.1, 0);
  });

  it('should exclude elnät from savings calculation', () => {
    const billData: BillData = {
      elnatCost: 1000, // Högt elnät
      elhandelCost: 200,
      extraFeesTotal: 0,
      extraFeesDetailed: [],
      totalKWh: 100,
      period: 'Jan 2025',
      contractType: 'fast',
      confidence: 0.95
    };

    const savings = calculateSavings(billData);

    // Elnät (1000) ska vara samma i både current och cheapest
    // Current: 1000 + 200 = 1200
    // Cheapest: 1000 + (100 * 0.50 + 29) = 1000 + 79 = 1079
    expect(savings.currentCost).toBe(1200);
    expect(savings.cheapestAlternative).toBe(1079);
  });

  it('should not return negative savings', () => {
    const billData: BillData = {
      elnatCost: 500,
      elhandelCost: 50,
      extraFeesTotal: 0,
      extraFeesDetailed: [],
      totalKWh: 50,
      period: 'Jan 2025',
      contractType: 'rörligt',
      confidence: 0.9
    };

    const savings = calculateSavings(billData);

    // Om redan billigt, besparing ska vara 0 (inte negativ)
    expect(savings.potentialSavings).toBeGreaterThanOrEqual(0);
  });
});

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1234)).toBe('1 234 kr');
    expect(formatCurrency(0)).toBe('0 kr');
    expect(formatCurrency(99.5)).toBe('100 kr');
  });
});

describe('getConfidenceColor', () => {
  it('should return correct color for high confidence', () => {
    expect(getConfidenceColor(0.95)).toBe('text-success');
    expect(getConfidenceColor(0.9)).toBe('text-success');
  });

  it('should return correct color for medium confidence', () => {
    expect(getConfidenceColor(0.8)).toBe('text-warning');
    expect(getConfidenceColor(0.7)).toBe('text-warning');
  });

  it('should return correct color for low confidence', () => {
    expect(getConfidenceColor(0.6)).toBe('text-error');
    expect(getConfidenceColor(0.5)).toBe('text-error');
  });
});

describe('getConfidenceLabel', () => {
  it('should return correct label', () => {
    expect(getConfidenceLabel(0.95)).toBe('Hög säkerhet');
    expect(getConfidenceLabel(0.8)).toBe('Medel säkerhet');
    expect(getConfidenceLabel(0.6)).toBe('Låg säkerhet');
  });
});

