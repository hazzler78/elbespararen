# 🎯 Guide: Träna AI med dina fakturor

## Steg 1: Förbered dina data

### Alternativ A: Lägg till dina fakturor direkt i koden

1. Öppna `src/lib/prepare-training-data.ts`
2. Ersätt `prepareYourInvoices()` funktionen med dina fakturor:

```typescript
export function prepareYourInvoices(): TrainingInvoice[] {
  return [
    {
      id: 'min-faktura-1',
      provider: 'Fortum',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din faktura som base64
      expectedResult: {
        elnatCost: 450.50,        // Vad som står på fakturan
        elhandelCost: 320.75,     // Vad som står på fakturan  
        extraFeesDetailed: [      // Alla extra avgifter
          { label: 'Elcertifikat', amount: 16.95 },
          { label: 'Månadsavgift', amount: 25.00 }
        ],
        totalAmount: 812.20,      // Total summa
        totalKWh: 450,            // Förbrukning
        period: '2024-01',        // Period
        contractType: 'rörligt'    // 'fast' eller 'rörligt'
      },
      confidence: 0.95 // Hur säker du är (0-1)
    }
    // Lägg till fler fakturor här...
  ];
}
```

### Alternativ B: Konvertera från ditt nuvarande format

Om du redan har fakturor i ett annat format:

```typescript
export function convertFromYourFormat(yourData: any[]): TrainingInvoice[] {
  return yourData.map((invoice, index) => ({
    id: `invoice-${index + 1}`,
    provider: invoice.provider, // t.ex. 'Fortum', 'EON'
    image: invoice.imageBase64, // Din faktura som base64
    expectedResult: {
      elnatCost: invoice.correctElnatCost,      // Rätt elnätskostnad
      elhandelCost: invoice.correctElhandelCost, // Rätt energikostnad
      extraFeesDetailed: invoice.correctExtraFees, // Rätt extra avgifter
      totalAmount: invoice.correctTotalAmount,   // Rätt total summa
      totalKWh: invoice.correctTotalKWh,        // Rätt förbrukning
      period: invoice.correctPeriod,            // Rätt period
      contractType: invoice.correctContractType  // 'fast' eller 'rörligt'
    },
    confidence: 0.9 // Hur säker du är
  }));
}
```

## Steg 2: Kör träningen

```bash
# Kör träningsscriptet
node scripts/train-ai.js
```

## Steg 3: Analysera resultat

Träningssystemet kommer att:

1. **Välja 40-50 representativa fakturor** från dina 100+
2. **Testa 4 olika prompt-varianter** på dessa fakturor
3. **Mäta noggrannhet** för varje prompt
4. **Identifiera vanliga fel** som AI:n gör
5. **Ge rekommendationer** för förbättring

## Steg 4: Förbättra systemet

Baserat på resultaten kan du:

- **Uppdatera prompten** med den bästa varianten
- **Lägga till regler** för vanliga fel
- **Träna mer** med fler fakturor
- **A/B-testa** olika approaches

## Exempel på resultat

```
📊 Träningsresultat:
- Bästa prompt: "Förenklad v2"
- Noggrannhet: 94.2%
- Antal fakturor: 45
- Vanliga fel: Moms som extra avgift, fel kolumn för belopp
- Rekommendationer: Lägg till explicit regel om moms
```

## Tips för bästa resultat

1. **Börja med 10-20 fakturor** för att testa systemet
2. **Välj fakturor från olika leverantörer** (Fortum, EON, Vattenfall, etc.)
3. **Se till att dina "expectedResult" är 100% korrekta**
4. **Använd confidence 0.9+** för fakturor du är säker på
5. **Lägg till fakturor med olika strukturer** (olika format, olika extra avgifter)

## Felsökning

### "Inga fakturor hittades"
- Kontrollera att `prepareYourInvoices()` returnerar en array med fakturor

### "Valideringsfel"
- Kontrollera att alla obligatoriska fält är ifyllda
- Se till att `totalAmount` och `totalKWh` är positiva tal
- Kontrollera att `confidence` är mellan 0 och 1

### "Låg noggrannhet"
- Lägg till fler fakturor från olika leverantörer
- Kontrollera att dina "expectedResult" är korrekta
- Överväg att förenkla prompten ytterligare
