// Besparingslogik för Elbespararen v7

import { BillData, SavingsCalculation } from "./types";

/**
 * Beräknar potentiella besparingar baserat på fakturadata
 * 
 * Regler:
 * 1. Elnät exkluderas ALLTID (ej påverkbart)
 * 2. Alla belopp inkluderar moms (25%)
 * 3. Jämför mot spotpris + minimal avgift
 */
export function calculateSavings(billData: BillData): SavingsCalculation {
  const { elnatCost, elhandelCost, extraFeesTotal, totalKWh, totalAmount } = billData;

  // Extra avgifter inkl. moms (25%)
  const extraFeesWithVAT = extraFeesTotal * 1.25;

  // Nuvarande total kostnad = exakt som "Belopp att betala" på fakturan
  const currentCost = totalAmount;

  // Beräkna billigaste alternativ
  // Anta spotpris ~0.50 kr/kWh (vintertid) + minimal månadskostnad 29 kr
  const estimatedSpotPrice = 0.50; // kr/kWh inkl. moms
  const minimalMonthlyFee = 29; // kr/mån

  const cheapestElhandelCost = totalKWh * estimatedSpotPrice + minimalMonthlyFee;
  
  // Potentiell besparing = endast extra avgifter (inkl. moms)
  // Elhandelsbesparing räknas inte eftersom spotpris kan variera
  const potentialSavings = extraFeesWithVAT;

  // Billigaste alternativ = nuvarande kostnad - besparing
  const cheapestAlternative = currentCost - potentialSavings;
  
  // Besparing i procent
  const savingsPercentage = currentCost > 0 
    ? (potentialSavings / currentCost) * 100 
    : 0;

  console.log('[calculateSavings] Debug:', {
    elnatCost,
    elhandelCost,
    extraFeesTotal,
    extraFeesWithVAT,
    totalAmount,
    totalKWh,
    currentCost,
    cheapestElhandelCost,
    cheapestAlternative,
    potentialSavings,
    note: "Besparing = endast extra avgifter (inkl. moms)"
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

