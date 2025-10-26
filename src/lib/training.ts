// AI-träningssystem för Elbespararen

export interface TrainingInvoice {
  id: string;
  provider: string;
  image: string; // base64 eller URL
  expectedResult: {
    elnatCost: number;
    elhandelCost: number;
    extraFeesDetailed: Array<{label: string, amount: number}>;
    totalAmount: number;
    totalKWh: number;
    period: string;
    contractType: 'fast' | 'rörligt';
  };
  confidence: number; // Hur säker vi är på att detta är korrekt
}

export interface PromptVariant {
  name: string;
  prompt: string;
  description: string;
}

export interface TestResult {
  invoiceId: string;
  promptName: string;
  accuracy: number;
  errors: string[];
  executionTime: number;
}

/**
 * Välj representativa fakturor för träning
 */
export function selectTrainingData(invoices: TrainingInvoice[]): TrainingInvoice[] {
  const providers = ['Fortum', 'EON', 'Vattenfall', 'Greenely', 'Tibber', 'Cheap Energy'];
  const selected: TrainingInvoice[] = [];
  
  // Välj max 8 fakturor per leverantör
  for (const provider of providers) {
    const providerInvoices = invoices
      .filter(inv => inv.provider === provider)
      .sort((a, b) => b.confidence - a.confidence) // Högsta confidence först
      .slice(0, 8);
    
    selected.push(...providerInvoices);
  }
  
  return selected;
}

/**
 * Analysera mönster i befintliga fakturor
 */
export function analyzeInvoicePatterns(invoices: TrainingInvoice[]) {
  const patterns = {
    providers: {} as Record<string, number>,
    commonFees: {} as Record<string, number>,
    avgAmounts: {
      elnatCost: 0,
      elhandelCost: 0,
      extraFeesTotal: 0,
      totalAmount: 0
    }
  };
  
  // Räkna leverantörer
  invoices.forEach(inv => {
    patterns.providers[inv.provider] = (patterns.providers[inv.provider] || 0) + 1;
  });
  
  // Räkna vanliga avgifter
  invoices.forEach(inv => {
    inv.expectedResult.extraFeesDetailed.forEach(fee => {
      patterns.commonFees[fee.label] = (patterns.commonFees[fee.label] || 0) + 1;
    });
  });
  
  // Beräkna genomsnittliga belopp
  const totals = invoices.reduce((acc, inv) => {
    acc.elnatCost += inv.expectedResult.elnatCost;
    acc.elhandelCost += inv.expectedResult.elhandelCost;
    acc.extraFeesTotal += inv.expectedResult.extraFeesDetailed.reduce((sum, fee) => sum + fee.amount, 0);
    acc.totalAmount += inv.expectedResult.totalAmount;
    return acc;
  }, { elnatCost: 0, elhandelCost: 0, extraFeesTotal: 0, totalAmount: 0 });
  
  const count = invoices.length;
  patterns.avgAmounts = {
    elnatCost: totals.elnatCost / count,
    elhandelCost: totals.elhandelCost / count,
    extraFeesTotal: totals.extraFeesTotal / count,
    totalAmount: totals.totalAmount / count
  };
  
  return patterns;
}

/**
 * Testa olika prompts på fakturor
 */
export async function testPromptsOnInvoices(
  invoices: TrainingInvoice[], 
  prompts: PromptVariant[]
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  for (const invoice of invoices) {
    for (const prompt of prompts) {
      const startTime = Date.now();
      
      try {
        // Simulera AI-analys (ersätt med riktig API-anrop)
        const aiResult = await analyzeWithPrompt(invoice, prompt);
        const accuracy = calculateAccuracy(aiResult, invoice.expectedResult);
        const errors = findErrors(aiResult, invoice.expectedResult);
        
        results.push({
          invoiceId: invoice.id,
          promptName: prompt.name,
          accuracy,
          errors,
          executionTime: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          invoiceId: invoice.id,
          promptName: prompt.name,
          accuracy: 0,
          errors: [`Error: ${error instanceof Error ? error.message : String(error)}`],
          executionTime: Date.now() - startTime
        });
      }
    }
  }
  
  return results;
}

/**
 * Beräkna noggrannhet mellan AI-resultat och förväntat resultat
 */
function calculateAccuracy(aiResult: any, expected: any): number {
  let score = 0;
  let totalChecks = 0;
  
  // Kontrollera totalAmount
  totalChecks++;
  if (Math.abs(aiResult.totalAmount - expected.totalAmount) < 10) {
    score++;
  }
  
  // Kontrollera elnatCost
  totalChecks++;
  if (Math.abs(aiResult.elnatCost - expected.elnatCost) < 5) {
    score++;
  }
  
  // Kontrollera elhandelCost
  totalChecks++;
  if (Math.abs(aiResult.elhandelCost - expected.elhandelCost) < 10) {
    score++;
  }
  
  // Kontrollera extra avgifter
  totalChecks++;
  const aiExtraTotal = aiResult.extraFeesDetailed.reduce((sum: number, fee: any) => sum + fee.amount, 0);
  const expectedExtraTotal = expected.extraFeesDetailed.reduce((sum: number, fee: any) => sum + fee.amount, 0);
  if (Math.abs(aiExtraTotal - expectedExtraTotal) < 20) {
    score++;
  }
  
  return (score / totalChecks) * 100;
}

/**
 * Hitta fel i AI-resultat
 */
function findErrors(aiResult: any, expected: any): string[] {
  const errors: string[] = [];
  
  if (Math.abs(aiResult.totalAmount - expected.totalAmount) > 10) {
    errors.push(`TotalAmount: AI ${aiResult.totalAmount} vs Expected ${expected.totalAmount}`);
  }
  
  if (Math.abs(aiResult.elnatCost - expected.elnatCost) > 5) {
    errors.push(`ElnatCost: AI ${aiResult.elnatCost} vs Expected ${expected.elnatCost}`);
  }
  
  if (Math.abs(aiResult.elhandelCost - expected.elhandelCost) > 10) {
    errors.push(`ElhandelCost: AI ${aiResult.elhandelCost} vs Expected ${expected.elhandelCost}`);
  }
  
  return errors;
}

/**
 * Simulera AI-analys (ersätt med riktig API-anrop)
 */
async function analyzeWithPrompt(invoice: TrainingInvoice, prompt: PromptVariant): Promise<any> {
  // Här skulle vi anropa riktig AI-API
  // För nu returnerar vi mock-data
  return {
    totalAmount: invoice.expectedResult.totalAmount,
    elnatCost: invoice.expectedResult.elnatCost,
    elhandelCost: invoice.expectedResult.elhandelCost,
    extraFeesDetailed: invoice.expectedResult.extraFeesDetailed,
    totalKWh: invoice.expectedResult.totalKWh,
    period: invoice.expectedResult.period,
    contractType: invoice.expectedResult.contractType
  };
}
