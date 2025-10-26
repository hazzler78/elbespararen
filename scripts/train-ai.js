// Enkelt script för att träna AI med dina fakturor

import { trainAIWithExistingInvoices, generateTrainingReport } from '../src/lib/training-tool.js';
import { prepareYourInvoices, validateTrainingData } from '../src/lib/prepare-training-data.js';

async function main() {
  console.log('🚀 Startar AI-träning...');
  
  try {
    // Steg 1: Ladda dina fakturor
    console.log('📁 Laddar dina fakturor...');
    const yourInvoices = prepareYourInvoices();
    console.log(`📊 Laddade ${yourInvoices.length} fakturor`);
    
    // Steg 2: Validera data
    console.log('✅ Validerar data...');
    const validation = validateTrainingData(yourInvoices);
    if (!validation.isValid) {
      console.error('❌ Valideringsfel:', validation.errors);
      return;
    }
    console.log('✅ Alla fakturor validerade korrekt');
    
    // Steg 3: Kör träning
    console.log('🧠 Tränar AI...');
    const results = await trainAIWithExistingInvoices(yourInvoices);
    
    // Steg 4: Visa resultat
    console.log('📊 Träningsresultat:');
    console.log(`- Bästa prompt: ${results.analysis.bestPrompt}`);
    console.log(`- Noggrannhet: ${results.analysis.averageAccuracy.toFixed(1)}%`);
    console.log(`- Antal fakturor: ${results.selectedInvoices.length}`);
    
    // Steg 5: Generera rapport
    const report = generateTrainingReport(results);
    console.log('\n📋 Träningsrapport:');
    console.log(report);
    
    console.log('✅ Träning klar!');
    
  } catch (error) {
    console.error('❌ Fel under träning:', error);
  }
}

// Kör träningen
main();
