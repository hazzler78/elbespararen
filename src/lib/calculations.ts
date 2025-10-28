// Besparingslogik för Elbespararen v7

import { BillData, SavingsCalculation } from "./types";

/**
 * Validerar fakturadata för att upptäcka fel
 */
function validateBillData(billData: BillData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validera att totalAmount är rimligt
  if (billData.totalAmount < 100 || billData.totalAmount > 10000) {
    errors.push(`TotalAmount ${billData.totalAmount} kr verkar orimligt`);
  }
  
  // Validera att elnät inte är negativt
  if (billData.elnatCost < 0) {
    errors.push(`ElnatCost ${billData.elnatCost} kr kan inte vara negativt`);
  }
  
  // Validera att elhandel inte är negativt
  if (billData.elhandelCost < 0) {
    errors.push(`ElhandelCost ${billData.elhandelCost} kr kan inte vara negativt`);
  }
  
  // Validera att extra avgifter inte är negativa
  if (billData.extraFeesTotal < 0) {
    errors.push(`ExtraFeesTotal ${billData.extraFeesTotal} kr kan inte vara negativt`);
  }
  
  // Validera att förbrukning är rimlig
  if (billData.totalKWh < 10 || billData.totalKWh > 5000) {
    errors.push(`TotalKWh ${billData.totalKWh} kWh verkar orimligt`);
  }
  
  // Validera att summan av extra avgifter stämmer
  const calculatedExtraFees = billData.extraFeesDetailed.reduce((sum, fee) => sum + fee.amount, 0);
  const tolerance = 0.01;
  if (Math.abs(calculatedExtraFees - billData.extraFeesTotal) > tolerance) {
    errors.push(`ExtraFeesDetailed summa ${calculatedExtraFees} kr matchar inte extraFeesTotal ${billData.extraFeesTotal} kr`);
  }
  
  // Validera att totalAmount är rimligt jämfört med komponenter
  const expectedTotal = billData.elnatCost + billData.elhandelCost + billData.extraFeesTotal;
  const totalTolerance = 50; // 50 kr tolerans för moms och avrundning
  if (Math.abs(expectedTotal - billData.totalAmount) > totalTolerance) {
    errors.push(`Förväntad total ${expectedTotal} kr matchar inte totalAmount ${billData.totalAmount} kr`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Beräknar potentiella besparingar baserat på fakturadata
 * 
 * Regler:
 * 1. Elnät exkluderas ALLTID (ej påverkbart)
 * 2. Extra avgifter kommer redan inkl. moms från AI-analysen
 * 3. Jämför mot spotpris + minimal avgift
 */
export function calculateSavings(billData: BillData): SavingsCalculation {
  const { elnatCost, elhandelCost, extraFeesTotal, extraFeesDetailed, totalKWh, totalAmount } = billData;

  // Använd summan av extraFeesDetailed
  // AI:n returnerar belopp EXKL. moms, men konsumenter behöver se priser INKL. moms
  const calculatedExtraFees = extraFeesDetailed.reduce((sum, fee) => sum + fee.amount, 0);
  const calculatedExtraFeesWithVAT = calculatedExtraFees * 1.25;

  // Nuvarande total kostnad = exakt som "Belopp att betala" på fakturan
  const currentCost = totalAmount;

  // Beräkna billigaste alternativ
  // Anta spotpris ~0.50 kr/kWh (vintertid) + minimal månadskostnad 29 kr
  const estimatedSpotPrice = 0.50; // kr/kWh inkl. moms
  const minimalMonthlyFee = 29; // kr/mån

  const cheapestElhandelCost = totalKWh * estimatedSpotPrice + minimalMonthlyFee;
  
  // Potentiell besparing = endast extra avgifter INKL. moms (för konsumenter)
  // Elhandelsbesparing räknas inte eftersom spotpris kan variera
  const potentialSavings = calculatedExtraFeesWithVAT;

  // Billigaste alternativ = nuvarande kostnad - besparing
  const cheapestAlternative = currentCost - potentialSavings;
  
  // Besparing i procent
  const savingsPercentage = currentCost > 0 
    ? (potentialSavings / currentCost) * 100 
    : 0;

  // Validera resultat
  const validation = validateBillData(billData);
  if (!validation.isValid) {
    console.warn('[calculateSavings] Validation failed:', validation.errors);
  }

  console.log('[calculateSavings] Debug:', {
    elnatCost,
    elhandelCost,
    extraFeesTotal,
    calculatedExtraFees,
    totalAmount,
    totalKWh,
    currentCost,
    cheapestElhandelCost,
    cheapestAlternative,
    potentialSavings,
    extraFeesDetailed: billData.extraFeesDetailed,
    validation: validation,
    note: "Besparing = summan av extra avgifter (inkl. moms)"
  });

  return {
    currentCost: Math.round(currentCost),
    cheapestAlternative: Math.round(cheapestAlternative),
    potentialSavings: Math.round(potentialSavings),
    savingsPercentage: Math.round(savingsPercentage * 10) / 10 // En decimal
  };
}

/**
 * Formaterar belopp till SEK-sträng
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formaterar pris per kWh till 2 decimaler
 */
export function formatPricePerKwh(price: number): string {
  const oreValue = Math.trunc(Number(price) * 100); // convert kr -> öre without rounding (truncate)
  const formatted = new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(oreValue);
  return `${formatted} öre/kWh`;
}

/**
 * Returnerar färgklass baserat på confidence
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "text-success";
  if (confidence >= 0.7) return "text-warning";
  return "text-error";
}

/**
 * Returnerar text baserat på confidence
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return "Hög säkerhet";
  if (confidence >= 0.7) return "Medel säkerhet";
  return "Låg säkerhet";
}

