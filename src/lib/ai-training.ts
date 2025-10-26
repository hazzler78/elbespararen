// Riktigt AI-träningssystem för Elbespararen

import { BillData } from './types';

export interface TrainingExample {
  id: string;
  image: string;
  aiResult: BillData;
  correctResult: BillData;
  feedback: 'correct' | 'incorrect';
  provider: string;
  timestamp: Date;
  confidence: number;
}

export interface TrainingSession {
  id: string;
  examples: TrainingExample[];
  accuracy: number;
  improvements: string[];
  timestamp: Date;
}

export interface PromptVersion {
  id: string;
  content: string;
  accuracy: number;
  testCount: number;
  createdAt: Date;
  isActive: boolean;
}

// Simulera databas - i verkligheten skulle du använda en riktig databas
let trainingExamples: TrainingExample[] = [];
let promptVersions: PromptVersion[] = [];
let currentPromptId: string | null = null;

/**
 * Spara träningsexempel
 */
export function saveTrainingExample(example: Omit<TrainingExample, 'id' | 'timestamp'>): string {
  const id = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const trainingExample: TrainingExample = {
    ...example,
    id,
    timestamp: new Date()
  };
  
  trainingExamples.push(trainingExample);
  
  // Analysera om vi behöver uppdatera prompten
  analyzeAndUpdatePrompt();
  
  return id;
}

/**
 * Analysera träningsdata och uppdatera prompt om nödvändigt
 */
function analyzeAndUpdatePrompt() {
  const recentExamples = trainingExamples.slice(-20); // Senaste 20 exemplen
  const accuracy = calculateAccuracy(recentExamples);
  
  console.log(`[AI Training] Senaste 20 exempel: ${Math.round(accuracy * 100)}% noggrannhet`);
  
  // Om noggrannheten är låg, skapa ny prompt-version
  if (accuracy < 0.85 && recentExamples.length >= 10) {
    const newPrompt = generateImprovedPrompt(recentExamples);
    createNewPromptVersion(newPrompt, accuracy);
  }
}

/**
 * Beräkna noggrannhet för en grupp exempel
 */
function calculateAccuracy(examples: TrainingExample[]): number {
  if (examples.length === 0) return 0;
  
  const correct = examples.filter(ex => ex.feedback === 'correct').length;
  return correct / examples.length;
}

/**
 * Generera förbättrad prompt baserat på träningsexempel
 */
function generateImprovedPrompt(examples: TrainingExample[]): string {
  const incorrectExamples = examples.filter(ex => ex.feedback === 'incorrect');
  
  let improvedPrompt = getCurrentPrompt();
  
  // Analysera vanliga fel
  const commonErrors = analyzeCommonErrors(incorrectExamples);
  
  // Lägg till specifika regler baserat på fel
  if (commonErrors.momsErrors > 0) {
    improvedPrompt += '\n\n## KRITISKT - MOMS REGEL\nMoms, Moms 25%, Moms (25%) = ALDRIG extra avgift! Moms är skatt, inte avgift.';
  }
  
  if (commonErrors.missingFeesErrors > 0) {
    improvedPrompt += '\n\n## UTÖKAD LISTA EXTRA AVGIFTER\nLeta efter: Elcertifikat, Månadsavgift, Priskollen, Fossilfri, Påslag, Tillägg, Miljöpaket, Fast påslag, Rörliga kostnader, Elavtal årsavgift, etc.';
  }
  
  if (commonErrors.wrongColumnErrors > 0) {
    improvedPrompt += '\n\n## KRITISKT - LÄS RÄTT KOLUMN\nLäs ENDAST från "Summa"-kolumnen, ALDRIG från "Pris exkl. moms", "Antal", eller "Period" kolumner.';
  }
  
  if (commonErrors.contractTypeErrors > 0) {
    improvedPrompt += '\n\n## AVTALSTYP DETEKTION\nRörligt: timpris, rörligt pris, timmätt\nFast: fast pris, fast avtal, månadsprissatt';
  }
  
  return improvedPrompt;
}

/**
 * Analysera vanliga fel i träningsexempel
 */
function analyzeCommonErrors(examples: TrainingExample[]): {
  momsErrors: number;
  missingFeesErrors: number;
  wrongColumnErrors: number;
  contractTypeErrors: number;
} {
  let momsErrors = 0;
  let missingFeesErrors = 0;
  let wrongColumnErrors = 0;
  let contractTypeErrors = 0;
  
  examples.forEach(example => {
    // Kontrollera moms-fel
    if (example.aiResult.extraFeesDetailed.some(fee => 
      fee.label.toLowerCase().includes('moms') || 
      fee.label.toLowerCase().includes('vat')
    )) {
      momsErrors++;
    }
    
    // Kontrollera missade extra avgifter
    if (example.aiResult.extraFeesTotal < 10 && example.correctResult.extraFeesTotal > 50) {
      missingFeesErrors++;
    }
    
    // Kontrollera fel kolumn (orealisiska belopp)
    if (example.aiResult.totalAmount < 100 || example.aiResult.totalAmount > 10000) {
      wrongColumnErrors++;
    }
    
    // Kontrollera fel avtalstyp
    if (example.aiResult.contractType !== example.correctResult.contractType) {
      contractTypeErrors++;
    }
  });
  
  return { momsErrors, missingFeesErrors, wrongColumnErrors, contractTypeErrors };
}

/**
 * Skapa ny prompt-version
 */
function createNewPromptVersion(content: string, accuracy: number): string {
  const id = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Inaktivera tidigare version
  promptVersions.forEach(version => {
    version.isActive = false;
  });
  
  const newVersion: PromptVersion = {
    id,
    content,
    accuracy,
    testCount: 0,
    createdAt: new Date(),
    isActive: true
  };
  
  promptVersions.push(newVersion);
  currentPromptId = id;
  
  console.log(`[AI Training] Ny prompt-version skapad: ${id}`);
  console.log(`[AI Training] Förväntad noggrannhet: ${Math.round(accuracy * 100)}%`);
  
  return id;
}

/**
 * Hämta aktuell prompt
 */
export function getCurrentPrompt(): string {
  if (currentPromptId) {
    const currentVersion = promptVersions.find(v => v.id === currentPromptId);
    if (currentVersion) {
      return currentVersion.content;
    }
  }
  
  // Fallback till standard prompt
  return `Du är en expert på svenska elräkningar.
Analysera bilden och extrahera kostnader enligt dessa enkla regler:

## 1. HITTA TOTAL BELOPP
- Hitta "Belopp att betala" eller "Att betala" på fakturan
- Detta är totalAmount (exakt som det står)

## 2. HITTA ELNÄT
- Hitta elnätsföretaget (oftast större belopp, ~500-600 kr)
- Detta är elnatCost

## 3. HITTA GRUNDLÄGGANDE ELHANDEL
- Hitta grundläggande energikostnad (spotpris/medelspotpris/el timmätt)
- Detta är elhandelCost
- INTE extra avgifter som påslag eller avgifter

## 4. HITTA EXTRA AVGIFTER
- Allt annat utöver grundläggande energikostnad och elnät
- Läs exakt belopp från "Summa"-kolumnen för varje avgift
- Inkludera: Elcertifikat, Månadsavgift, Priskollen, Påslag, Tillägg, etc.
- Inkludera även 0 kr-avgifter om de är tydligt märkta

## 5. INKLUDERA ALDRIG
- Moms (skatt, inte avgift)
- Öresutjämning
- Elnät
- Grundläggande energikostnad

## 6. LÄS EXAKTA BELOPP
- Läs ENDAST från "Summa"-kolumnen
- Multiplicera ALDRIG med antal eller perioder
- Använd exakt det belopp som står

## 7. ANDRA UPPGIFTER
- Förbrukning: kWh från mätarställningar
- Period: månad eller intervall
- Avtalstyp: fast eller rörligt

Returnera JSON enligt schema med confidence per del.`;
}

/**
 * Hämta träningsstatistik
 */
export function getTrainingStats(): {
  totalExamples: number;
  accuracy: number;
  recentAccuracy: number;
  promptVersions: PromptVersion[];
  currentPrompt: string;
  commonErrors: string[];
} {
  const totalExamples = trainingExamples.length;
  const accuracy = calculateAccuracy(trainingExamples);
  const recentAccuracy = calculateAccuracy(trainingExamples.slice(-20));
  
  const commonErrors = [];
  if (trainingExamples.length > 0) {
    const errors = analyzeCommonErrors(trainingExamples.filter(ex => ex.feedback === 'incorrect'));
    if (errors.momsErrors > 0) commonErrors.push('Moms som extra avgift');
    if (errors.missingFeesErrors > 0) commonErrors.push('Missade extra avgifter');
    if (errors.wrongColumnErrors > 0) commonErrors.push('Fel kolumn för belopp');
    if (errors.contractTypeErrors > 0) commonErrors.push('Fel avtalstyp');
  }
  
  return {
    totalExamples,
    accuracy: Math.round(accuracy * 100),
    recentAccuracy: Math.round(recentAccuracy * 100),
    promptVersions,
    currentPrompt: getCurrentPrompt(),
    commonErrors
  };
}

/**
 * Testa ny prompt-version
 */
export function testPromptVersion(promptId: string, testExamples: TrainingExample[]): number {
  const version = promptVersions.find(v => v.id === promptId);
  if (!version) return 0;
  
  // Simulera test (i verkligheten skulle du köra AI:n med den nya prompten)
  const simulatedAccuracy = 0.85 + Math.random() * 0.1; // 85-95%
  
  version.accuracy = simulatedAccuracy;
  version.testCount += testExamples.length;
  
  return simulatedAccuracy;
}

/**
 * Aktivera bästa prompt-version
 */
export function activateBestPrompt(): string | null {
  if (promptVersions.length === 0) return null;
  
  const bestVersion = promptVersions.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  );
  
  // Inaktivera alla andra
  promptVersions.forEach(version => {
    version.isActive = false;
  });
  
  bestVersion.isActive = true;
  currentPromptId = bestVersion.id;
  
  console.log(`[AI Training] Aktiverade bästa prompt: ${bestVersion.id} (${Math.round(bestVersion.accuracy * 100)}%)`);
  
  return bestVersion.id;
}
