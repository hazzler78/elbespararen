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
  postalCode?: string; // Postnummer för prisområdesdetektering
  priceArea?: string; // Automatiskt detekterat prisområde (se1, se2, se3, se4)
  imageKey?: string; // Nyckel till sparad fakturabild
  imageUrl?: string; // Ev. publik URL till fakturabild
  originalFileName?: string; // Ursprungligt filnamn
  uploadedAt?: string; // ISO-tid när fakturan laddades upp
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
  subscribeNewsletter?: boolean;
}

export interface ContractAlternative {
  namn: string;
  fastpris?: number; // kr/kWh för fastpris
  månadskostnad?: number; // kr/månad
  bindningstid?: number; // månader
  gratis_månader?: number;
  spotpris?: number; // kr/kWh för rörligt (spotpris)
  påslag?: number; // kr/kWh påslag på spotpris
  areaCode?: string; // Prisområde (se1, se2, se3, se4)
}

export interface ElectricityProvider {
  id: string;
  name: string;
  description: string;
  monthlyFee: number; // kr/månad
  energyPrice: number; // kr/kWh (för rörligt avtal) eller fastpris (för fastprisavtal), inkl. moms när tillgängligt
  freeMonths: number; // Antal gratis månader
  contractLength: number; // Månader
  contractType: "rörligt" | "fastpris"; // Avtalstyp
  isActive: boolean;
  userHidden?: boolean; // Markering när användaren medvetet dolt leverantören
  customerType: "private" | "business"; // Vilken målgrupp avtalet riktar sig mot
  features: string[];
  logoUrl?: string;
  websiteUrl?: string;
  affiliateUrl?: string; // Om satt: redirecta användaren direkt till denna länk
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  avtalsalternativ?: ContractAlternative[]; // Flera avtalsalternativ för fastpris
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
  priceSnapshot?: {
    area: string;
    price?: number; // spotpris i öre/kWh
    surcharge?: number; // påslag i öre/kWh
    el_certificate_fee?: number; // elcertifikat i öre/kWh
    _12_month_discount?: number; // rabatt i öre/kWh
    monthly_fee?: number; // månadsavgift i kr
    total?: number; // total exkl moms i öre/kWh
    total_with_vat?: number; // total inkl moms i öre/kWh
  };
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  personalNumber?: string; // För identitetsverifiering
  paymentMethod: "autogiro" | "faktura" | "bankgiro";
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

// News Post types
export interface NewsPost {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  imageUrl?: string; // URL till bild från inlägget
  externalLink?: string; // Extern länk om nyheten kommer från extern källa
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean; // Om false, visas inte på /news sidan
}

// Chat Message types
export interface ChatMessage {
  id: string;
  sessionId: string; // Unik session-ID för varje chat-session
  role: 'user' | 'assistant' | 'system';
  content: string;
  context?: {
    totalAmount?: number;
    extraFeesTotal?: number;
    extraFeesDetailed?: ExtraFeeDetailed[];
    totalKWh?: number;
    period?: string;
    contractType?: "fast" | "rörligt";
  };
  ipAddress?: string;
  userAgent?: string;
  model?: string; // AI-modell som användes
  responseTimeMs?: number; // Svarstid i millisekunder
  error?: string;
  createdAt: Date;
}

// Postal Code Analytics types
export interface PostalCodeAnalytics {
  id: string;
  postalCode: string;
  detectedArea?: string; // Automatiskt detekterat område (se1, se2, se3, se4)
  selectedArea: string; // Slutligt valt område
  wasManuallyChanged: boolean; // Om användaren ändrade området manuellt
  ipAddress?: string;
  userAgent?: string;
  pageContext?: string; // Var användaren var när de angav postnummer (t.ex. "upload", "contracts")
  createdAt: Date;
}

// Bill Analysis types (för admin-granskning)
export interface BillAnalysis {
  id: string;
  billData: BillData;
  savings: SavingsCalculation;
  imageKey?: string;
  imageUrl?: string;
  originalFileName?: string;
  postalCode?: string;
  priceArea?: string;
  aiConfidence?: number;
  aiWarnings?: string[];
  validationStatus: 'pending' | 'correct' | 'incorrect' | 'needs_review';
  validationNotes?: string;
  validatedBy?: string;
  validatedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}