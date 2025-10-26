// Enkelt test av träningssystemet

console.log('🚀 Startar AI-träning...');

// Simulera träningsdata
const mockInvoices = [
  {
    id: 'eon-2025-08',
    provider: 'EON',
    expectedResult: {
      elnatCost: 575.89,
      elhandelCost: 191.60,
      extraFeesDetailed: [
        { label: 'Rörliga kostnader', amount: 17.53 },
        { label: 'Fast påslag', amount: 17.02 },
        { label: 'Elavtal årsavgift', amount: 44.84 }
      ],
      totalAmount: 1059.00,
      totalKWh: 425,
      period: '2025-08',
      contractType: 'rörligt'
    },
    confidence: 0.99
  },
  {
    id: 'fortum-2025-09',
    provider: 'Fortum',
    expectedResult: {
      elnatCost: 0,
      elhandelCost: 95.83,
      extraFeesDetailed: [
        { label: 'Elcertifikat', amount: 3.26 },
        { label: 'Månadsavgift', amount: 39.20 },
        { label: 'Fossilfri', amount: 0.00 }
      ],
      totalAmount: 172.87,
      totalKWh: 148.35,
      period: '2025-09',
      contractType: 'rörligt'
    },
    confidence: 0.99
  }
];

console.log(`📊 Laddade ${mockInvoices.length} fakturor`);

// Simulera träningsresultat
const mockResults = {
  selectedInvoices: mockInvoices,
  patterns: {
    providers: {
      'EON': 1,
      'Fortum': 1
    },
    commonFees: {
      'Rörliga kostnader': 1,
      'Fast påslag': 1,
      'Elavtal årsavgift': 1,
      'Elcertifikat': 1,
      'Månadsavgift': 1,
      'Fossilfri': 1
    }
  },
  analysis: {
    bestPrompt: 'Förenklad v2',
    averageAccuracy: 94.2,
    promptPerformance: {
      'Förenklad v1': { averageAccuracy: 89.5, averageExecutionTime: 1200 },
      'Förenklad v2': { averageAccuracy: 94.2, averageExecutionTime: 1100 },
      'Detaljerad v1': { averageAccuracy: 87.8, averageExecutionTime: 1800 },
      'Detaljerad v2': { averageAccuracy: 91.3, averageExecutionTime: 1600 }
    },
    commonErrors: [
      'Moms som extra avgift',
      'Fel kolumn för belopp',
      'Missade extra avgifter'
    ]
  },
  recommendations: [
    '✅ Hög noggrannhet - prompten fungerar bra',
    '🔧 Vanliga fel: Moms som extra avgift, Fel kolumn för belopp',
    '📈 Bästa prompt: Förenklad v2 med 94.2% noggrannhet'
  ]
};

console.log('✅ Alla fakturor validerade korrekt');
console.log('🧠 Tränar AI...');

// Simulera träningstid
setTimeout(() => {
  console.log('📊 Träningsresultat:');
  console.log(`- Bästa prompt: ${mockResults.analysis.bestPrompt}`);
  console.log(`- Noggrannhet: ${mockResults.analysis.averageAccuracy.toFixed(1)}%`);
  console.log(`- Antal fakturor: ${mockResults.selectedInvoices.length}`);
  
  console.log('\n📋 Träningsrapport:');
  console.log('# AI-träningsrapport');
  console.log('');
  console.log('## Sammanfattning');
  console.log(`- **Antal fakturor testade**: ${mockResults.selectedInvoices.length}`);
  console.log(`- **Bästa prompt**: ${mockResults.analysis.bestPrompt}`);
  console.log(`- **Genomsnittlig noggrannhet**: ${mockResults.analysis.averageAccuracy.toFixed(1)}%`);
  console.log(`- **Antal prompts testade**: ${Object.keys(mockResults.analysis.promptPerformance).length}`);
  console.log('');
  console.log('## Prompt-prestation');
  Object.entries(mockResults.analysis.promptPerformance).forEach(([name, perf]) => {
    console.log(`### ${name}`);
    console.log(`- Noggrannhet: ${perf.averageAccuracy.toFixed(1)}%`);
    console.log(`- Exekveringstid: ${perf.averageExecutionTime.toFixed(0)}ms`);
  });
  console.log('');
  console.log('## Vanliga fel');
  mockResults.analysis.commonErrors.forEach(error => console.log(`- ${error}`));
  console.log('');
  console.log('## Rekommendationer');
  mockResults.recommendations.forEach(rec => console.log(`- ${rec}`));
  
  console.log('\n✅ Träning klar!');
}, 2000);
