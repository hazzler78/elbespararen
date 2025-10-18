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
  totalAmount: number; // Total belopp att betala
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

export interface ElectricityProvider {
  id: string;
  name: string;
  description: string;
  monthlyFee: number; // kr/månad
  energyPrice: number; // kr/kWh
  freeMonths: number; // Antal gratis månader
  contractLength: number; // Månader
  isActive: boolean;
  features: string[];
  logoUrl?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderComparison {
  provider: ElectricityProvider;
  estimatedMonthlyCost: number;
  estimatedSavings: number;
  isRecommended: boolean;
}

// Bytprocess-typer
export interface SwitchRequest {
  id: string;
  customerInfo: CustomerInfo;
  currentProvider: CurrentProviderInfo;
  newProvider: ElectricityProvider;
  billData: BillData;
  savings: SavingsCalculation;
  status: SwitchStatus;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  personalNumber?: string; // För identitetsverifiering
  preferredContactMethod: "email" | "phone" | "sms";
  consentToMarketing: boolean;
  consentToDataProcessing: boolean;
}

export interface Address {
  street: string;
  streetNumber: string;
  apartment?: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface CurrentProviderInfo {
  name: string;
  customerNumber?: string;
  contractEndDate?: string;
  noticePeriod?: number; // Dagar
  hasFixedContract: boolean;
  currentMonthlyCost: number;
}

export type SwitchStatus = 
  | "pending"           // Väntar på kunduppgifter
  | "verifying"         // Verifierar kunduppgifter
  | "processing"        // Bearbetar bytet
  | "submitted"         // Skickat till ny leverantör
  | "confirmed"         // Bekräftat av ny leverantör
  | "completed"         // Bytet genomfört
  | "cancelled"         // Avbrutet av kund
  | "failed";           // Misslyckades

export interface SwitchStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  estimatedDuration?: string;
  completedAt?: Date;
  notes?: string;
}

export interface SwitchProgress {
  currentStep: number;
  totalSteps: number;
  steps: SwitchStep[];
  estimatedCompletion: Date;
  nextAction?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}