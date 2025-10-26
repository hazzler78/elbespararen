// System för att lära AI:n från feedback

import { BillData } from './types';

export interface LearningData {
  id: string;
  image: string;
  aiResult: BillData;
  userFeedback: 'correct' | 'incorrect';
  userCorrections?: Partial<BillData>;
  timestamp: Date;
  provider?: string;
}

export interface LearningInsights {
  commonErrors: string[];
  improvementAreas: string[];
  confidenceTrend: number[];
  accuracyByProvider: Record<string, number>;
  promptSuggestions: PromptSuggestion[];
}

export interface PromptSuggestion {
  type: string;
  current: string;
  improvement: string;
  impact: 'Hög' | 'Medium' | 'Låg';
  confidence: number;
}

/**
 * Analysera träningsdata för att identifiera mönster och förbättringar
 */
export function analyzeLearningData(learningData: LearningData[]): LearningInsights {
  const total = learningData.length;
  const incorrect = learningData.filter(d => d.userFeedback === 'incorrect');
  
  // Identifiera vanliga fel
  const commonErrors = identifyCommonErrors(incorrect);
  
  // Identifiera förbättringsområden
  const improvementAreas = identifyImprovementAreas(incorrect);
  
  // Beräkna konfidensutveckling
  const confidenceTrend = calculateConfidenceTrend(learningData);
  
  // Beräkna noggrannhet per leverantör
  const accuracyByProvider = calculateAccuracyByProvider(learningData);
  
  // Generera prompt-förslag
  const promptSuggestions = generatePromptSuggestions(commonErrors, improvementAreas);
  
  return {
    commonErrors,
    improvementAreas,
    confidenceTrend,
    accuracyByProvider,
    promptSuggestions
  };
}

/**
 * Identifiera vanliga fel baserat på felaktiga svar
 */
function identifyCommonErrors(incorrectData: LearningData[]): string[] {
  const errors: string[] = [];
  
  // Analysera felaktiga svar för mönster
  const momsErrors = incorrectData.filter(d => 
    d.aiResult.extraFeesDetailed.some(fee => 
      fee.label.toLowerCase().includes('moms') || 
      fee.label.toLowerCase().includes('vat')
    )
  ).length;
  
  if (momsErrors > 0) {
    errors.push(`Moms som extra avgift (${Math.round((momsErrors / incorrectData.length) * 100)}% av fallen)`);
  }
  
  const missingFeesErrors = incorrectData.filter(d => 
    d.aiResult.extraFeesTotal < 10 // Förmodligen missade extra avgifter
  ).length;
  
  if (missingFeesErrors > 0) {
    errors.push(`Missade extra avgifter (${Math.round((missingFeesErrors / incorrectData.length) * 100)}% av fallen)`);
  }
  
  const wrongColumnErrors = incorrectData.filter(d => 
    d.aiResult.totalAmount < 100 || d.aiResult.totalAmount > 10000 // Orealistiska belopp
  ).length;
  
  if (wrongColumnErrors > 0) {
    errors.push(`Fel kolumn för belopp (${Math.round((wrongColumnErrors / incorrectData.length) * 100)}% av fallen)`);
  }
  
  return errors;
}

/**
 * Identifiera förbättringsområden
 */
function identifyImprovementAreas(incorrectData: LearningData[]): string[] {
  const areas: string[] = [];
  
  if (incorrectData.some(d => d.aiResult.extraFeesDetailed.some(fee => fee.label.toLowerCase().includes('moms')))) {
    areas.push('Förbättra moms-hantering');
  }
  
  if (incorrectData.some(d => d.aiResult.extraFeesTotal < 10)) {
    areas.push('Lägg till fler exempel på extra avgifter');
  }
  
  if (incorrectData.some(d => d.aiResult.totalAmount < 100 || d.aiResult.totalAmount > 10000)) {
    areas.push('Förtydliga kolumn-instruktioner');
  }
  
  // Kontrollera om avtalstyp-detektering behöver förbättras
  // (contractType kan bara vara "fast" | "rörligt", så "okänd" är inte möjligt)
  
  return areas;
}

/**
 * Beräkna konfidensutveckling över tid
 */
function calculateConfidenceTrend(learningData: LearningData[]): number[] {
  // Gruppera efter dag och beräkna genomsnittlig konfidens
  const dailyConfidence = learningData.reduce((acc, data) => {
    const day = data.timestamp.toISOString().split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(data.aiResult.confidence);
    return acc;
  }, {} as Record<string, number[]>);
  
  return Object.values(dailyConfidence).map(confidences => 
    confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
  );
}

/**
 * Beräkna noggrannhet per leverantör
 */
function calculateAccuracyByProvider(learningData: LearningData[]): Record<string, number> {
  const providerStats = learningData.reduce((acc, data) => {
    const provider = data.provider || 'Okänd';
    if (!acc[provider]) {
      acc[provider] = { total: 0, correct: 0 };
    }
    acc[provider].total++;
    if (data.userFeedback === 'correct') {
      acc[provider].correct++;
    }
    return acc;
  }, {} as Record<string, { total: number; correct: number }>);
  
  return Object.entries(providerStats).reduce((acc, [provider, stats]) => {
    acc[provider] = Math.round((stats.correct / stats.total) * 100);
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Generera prompt-förslag baserat på analys
 */
function generatePromptSuggestions(commonErrors: string[], improvementAreas: string[]): PromptSuggestion[] {
  const suggestions: PromptSuggestion[] = [];
  
  if (commonErrors.some(error => error.includes('Moms'))) {
    suggestions.push({
      type: 'Moms-hantering',
      current: 'AI:n inkluderar moms som extra avgift',
      improvement: 'Lägg till explicit regel: "Moms är skatt, inte avgift"',
      impact: 'Hög',
      confidence: 0.9
    });
  }
  
  if (commonErrors.some(error => error.includes('Missade extra avgifter'))) {
    suggestions.push({
      type: 'Extra avgifter',
      current: 'AI:n missar vissa extra avgifter',
      improvement: 'Utöka listan med fler exempel på extra avgifter',
      impact: 'Medium',
      confidence: 0.8
    });
  }
  
  if (commonErrors.some(error => error.includes('Fel kolumn'))) {
    suggestions.push({
      type: 'Kolumn-instruktioner',
      current: 'AI:n läser från fel kolumn',
      improvement: 'Förtydliga att endast "Summa"-kolumnen ska läsas',
      impact: 'Hög',
      confidence: 0.85
    });
  }
  
  return suggestions;
}

/**
 * Uppdatera prompt baserat på lärdata
 */
export function updatePromptBasedOnLearning(
  currentPrompt: string, 
  insights: LearningInsights
): string {
  let updatedPrompt = currentPrompt;
  
  // Lägg till moms-regel om det är ett problem
  if (insights.commonErrors.some(error => error.includes('Moms'))) {
    updatedPrompt += '\n\n## KRITISKT - MOMS REGEL\nMoms, Moms 25%, Moms (25%) = ALDRIG extra avgift!';
  }
  
  // Utöka extra avgifter-lista om det behövs
  if (insights.commonErrors.some(error => error.includes('Missade extra avgifter'))) {
    updatedPrompt += '\n\n## UTÖKAD LISTA EXTRA AVGIFTER\nLeta efter: Elcertifikat, Månadsavgift, Priskollen, Fossilfri, Påslag, Tillägg, Miljöpaket, etc.';
  }
  
  // Förtydliga kolumn-instruktioner
  if (insights.commonErrors.some(error => error.includes('Fel kolumn'))) {
    updatedPrompt += '\n\n## KRITISKT - LÄS RÄTT KOLUMN\nLäs ENDAST från "Summa"-kolumnen, ALDRIG från "Pris exkl. moms" eller "Antal"';
  }
  
  return updatedPrompt;
}

/**
 * Beräkna AI:ns förbättring över tid
 */
export function calculateImprovementTrend(learningData: LearningData[]): {
  accuracyImprovement: number;
  confidenceImprovement: number;
  errorReduction: number;
} {
  if (learningData.length < 2) {
    return { accuracyImprovement: 0, confidenceImprovement: 0, errorReduction: 0 };
  }
  
  // Dela data i två halvor
  const midpoint = Math.floor(learningData.length / 2);
  const firstHalf = learningData.slice(0, midpoint);
  const secondHalf = learningData.slice(midpoint);
  
  // Beräkna noggrannhet för varje halva
  const firstHalfAccuracy = firstHalf.filter(d => d.userFeedback === 'correct').length / firstHalf.length;
  const secondHalfAccuracy = secondHalf.filter(d => d.userFeedback === 'correct').length / secondHalf.length;
  
  // Beräkna genomsnittlig konfidens
  const firstHalfConfidence = firstHalf.reduce((sum, d) => sum + d.aiResult.confidence, 0) / firstHalf.length;
  const secondHalfConfidence = secondHalf.reduce((sum, d) => sum + d.aiResult.confidence, 0) / secondHalf.length;
  
  return {
    accuracyImprovement: Math.round((secondHalfAccuracy - firstHalfAccuracy) * 100),
    confidenceImprovement: Math.round((secondHalfConfidence - firstHalfConfidence) * 100),
    errorReduction: Math.round((firstHalfAccuracy - secondHalfAccuracy) * 100) // Negativ = färre fel
  };
}
