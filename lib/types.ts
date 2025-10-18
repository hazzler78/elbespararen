// TypeScript-typer för Elbespararen v7

export interface ExtraFeeDetailed {
  label: string;
  amount: number;
  confidence: number; // 0-1
}

export interface BillData {
  elnatCost: number;
  elhandelCost: number;
  extraFeesTotal: number;
  extraFeesDetailed: ExtraFeeDetailed[];
  totalKWh: number;
  period: string;
  contractType: "fast" | "rörligt";
  confidence: number; // 0-1
  warnings?: string[];
}

export interface SavingsCalculation {
  currentCost: number; // Total inkl moms
  cheapestAlternative: number;
  potentialSavings: number;
  savingsPercentage: number;
}

export interface Lead {
  id: string;
  email?: string;
  phone?: string;
  billData: BillData;
  savings: SavingsCalculation;
  createdAt: Date;
  status: "new" | "contacted" | "converted" | "rejected";
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

