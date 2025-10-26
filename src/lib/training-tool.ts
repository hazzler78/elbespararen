// Verktyg för att träna AI med befintliga fakturor

import { TrainingInvoice, selectTrainingData, analyzeInvoicePatterns, testPromptsOnInvoices } from './training';
import { getAllPromptVariants } from './prompt-variants';

/**
 * Huvudfunktion för att träna AI med befintliga fakturor
 */
export async function trainAIWithExistingInvoices(invoices: TrainingInvoice[]) {
  console.log(`🚀 Startar AI-träning med ${invoices.length} fakturor`);
  
  // Steg 1: Välj representativa fakturor
  const selectedInvoices = selectTrainingData(invoices);
  console.log(`📊 Valde ${selectedInvoices.length} representativa fakturor`);
  
  // Steg 2: Analysera mönster
  const patterns = analyzeInvoicePatterns(selectedInvoices);
  console.log('🔍 Analyserade mönster:', patterns);
  
  // Steg 3: Testa olika prompts
  const prompts = getAllPromptVariants();
  const testResults = await testPromptsOnInvoices(selectedInvoices, prompts);
  
  // Steg 4: Analysera resultat
  const analysis = analyzeTestResults(testResults);
  console.log('📈 Testresultat:', analysis);
  
  return {
    selectedInvoices,
    patterns,
    testResults,
    analysis,
    recommendations: generateRecommendations(analysis)
  };
}

/**
 * Analysera testresultat
 */
function analyzeTestResults(results: any[]) {
  const analysis = {
    bestPrompt: '',
    averageAccuracy: 0,
    promptPerformance: {} as Record<string, any>,
    commonErrors: [] as string[],
    executionTimes: {} as Record<string, number>
  };
  
  // Gruppera resultat per prompt
  const promptGroups = results.reduce((groups, result) => {
    if (!groups[result.promptName]) {
      groups[result.promptName] = [];
    }
    groups[result.promptName].push(result);
    return groups;
  }, {} as Record<string, any[]>);
  
  // Analysera varje prompt
  for (const [promptName, results] of Object.entries(promptGroups)) {
    const resultsArray = results as any[];
    const accuracies = resultsArray.map(r => r.accuracy);
    const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const avgExecutionTime = resultsArray.reduce((sum, r) => sum + r.executionTime, 0) / resultsArray.length;
    
    analysis.promptPerformance[promptName] = {
      averageAccuracy: avgAccuracy,
      averageExecutionTime: avgExecutionTime,
      totalTests: resultsArray.length,
      successRate: accuracies.filter(acc => acc > 80).length / accuracies.length
    };
    
    // Hitta bästa prompt
    if (avgAccuracy > analysis.averageAccuracy) {
      analysis.averageAccuracy = avgAccuracy;
      analysis.bestPrompt = promptName;
    }
  }
  
  // Hitta vanliga fel
  const allErrors = results.flatMap(r => r.errors);
  const errorCounts = allErrors.reduce((counts, error) => {
    counts[error] = (counts[error] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  analysis.commonErrors = Object.entries(errorCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([error]) => error);
  
  return analysis;
}

/**
 * Generera rekommendationer baserat på analys
 */
function generateRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];
  
  if (analysis.averageAccuracy < 70) {
    recommendations.push('⚠️ Låg noggrannhet - överväg att förenkla prompten ytterligare');
  }
  
  if (analysis.averageAccuracy > 90) {
    recommendations.push('✅ Hög noggrannhet - prompten fungerar bra');
  }
  
  const bestPrompt = analysis.promptPerformance[analysis.bestPrompt];
  if (bestPrompt.averageExecutionTime > 5000) {
    recommendations.push('⏱️ Långsam exekvering - överväg att optimera prompten');
  }
  
  if (analysis.commonErrors.length > 0) {
    recommendations.push(`🔧 Vanliga fel: ${analysis.commonErrors.join(', ')}`);
  }
  
  return recommendations;
}

/**
 * Skapa träningsrapport
 */
export function generateTrainingReport(results: any): string {
  const report = `
# AI-träningsrapport

## Sammanfattning
- **Antal fakturor testade**: ${results.selectedInvoices.length}
- **Bästa prompt**: ${results.analysis.bestPrompt}
- **Genomsnittlig noggrannhet**: ${results.analysis.averageAccuracy.toFixed(1)}%
- **Antal prompts testade**: ${Object.keys(results.analysis.promptPerformance).length}

## Prompt-prestation
${Object.entries(results.analysis.promptPerformance).map(([name, perf]: [string, any]) => `
### ${name}
- Noggrannhet: ${perf.averageAccuracy.toFixed(1)}%
- Exekveringstid: ${perf.averageExecutionTime.toFixed(0)}ms
- Framgångsrate: ${(perf.successRate * 100).toFixed(1)}%
`).join('')}

## Vanliga fel
${results.analysis.commonErrors.map((error: string) => `- ${error}`).join('\n')}

## Rekommendationer
${results.recommendations.map((rec: string) => `- ${rec}`).join('\n')}
`;

  return report;
}
