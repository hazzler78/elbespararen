// Olika prompt-varianter för A/B-testning

export const PROMPT_VARIANTS = [
  {
    name: 'current-simplified',
    description: 'Vår nuvarande förenklade prompt',
    prompt: `Du är en expert på svenska elräkningar.
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

Returnera JSON enligt schema med confidence per del.`
  },
  
  {
    name: 'ultra-simple',
    description: 'Ännu enklare prompt',
    prompt: `Analysera denna svenska elfaktura:

1. Hitta "Belopp att betala" = totalAmount
2. Hitta elnätsföretaget = elnatCost  
3. Hitta grundläggande energikostnad = elhandelCost
4. Allt annat = extra avgifter (läs från "Summa"-kolumnen)
5. Inkludera ALDRIG moms som extra avgift

Returnera JSON enligt schema.`
  },
  
  {
    name: 'structured-approach',
    description: 'Mer strukturerad approach',
    prompt: `Du analyserar svenska elfakturor. Följ dessa steg:

STEG 1: Identifiera leverantör
- Fortum, EON, Vattenfall, etc.

STEG 2: Hitta huvudbelopp
- "Belopp att betala" = totalAmount
- "Att betala" = totalAmount

STEG 3: Kategorisera kostnader
- Elnät = elnatCost (oftast större belopp)
- Grundläggande energikostnad = elhandelCost
- Allt annat = extra avgifter

STEG 4: Läs extra avgifter
- Läs från "Summa"-kolumnen
- Inkludera: Elcertifikat, Månadsavgift, Priskollen, Påslag
- Exkludera: Moms, Öresutjämning

Returnera JSON enligt schema.`
  },
  
  {
    name: 'example-based',
    description: 'Med konkreta exempel',
    prompt: `Analysera svenska elfakturor. Här är exempel:

EXEMPEL 1 - Fortum:
- "Belopp att betala: 617,80 kr" → totalAmount: 617.80
- "Elnät: 0 kr" → elnatCost: 0
- "El timmätt: 309,10 kr" → elhandelCost: 309.10
- "Elcertifikat: 11,04 kr" → extra avgift
- "Månadsavgift: 55,20 kr" → extra avgift

EXEMPEL 2 - EON:
- "Belopp att betala: 1059,00 kr" → totalAmount: 1059.00
- "Elnät: 575,89 kr" → elnatCost: 575.89
- "Spotpris: 191,00 kr" → elhandelCost: 191.00
- "Rörliga kostnader: 23,36 kr" → extra avgift

REGEL: Läs exakt belopp från "Summa"-kolumnen. Inkludera ALDRIG moms.

Returnera JSON enligt schema.`
  },
  
  {
    name: 'improved-moms',
    description: 'Förbättrad moms-hantering och utökad extra avgifter',
    prompt: `Du är en expert på svenska elräkningar.
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
- Inkludera: Elcertifikat, Månadsavgift, Priskollen, Påslag, Tillägg, Rörliga kostnader, Fast påslag, Elavtal årsavgift, Energiskatt, Elöverföring, Fast avgift, Miljöpaket, Fossilfri, Rabatt, Kampanjrabatt, etc.
- Inkludera även 0 kr-avgifter om de är tydligt märkta

## 5. INKLUDERA ALDRIG
- Moms (Moms är skatt, inte avgift - ALDRIG inkludera moms som extra avgift)
- Öresutjämning
- Elnät
- Grundläggande energikostnad

## 6. MOMS-HANTERING
- Moms är alltid skatt, aldrig en extra avgift
- Om du ser "Moms 25%" eller liknande, ignorera det helt
- Moms påverkar inte extra avgifter eller besparingar

## 7. LÄS EXAKTA BELOPP
- Läs ENDAST från "Summa"-kolumnen
- Multiplicera ALDRIG med antal eller perioder
- Använd exakt det belopp som står

## 8. ANDRA UPPGIFTER
- Förbrukning: kWh från mätarställningar
- Period: månad eller intervall
- Avtalstyp: fast eller rörligt

Returnera JSON enligt schema med confidence per del.`
  }
];

/**
 * Hämta prompt-variant baserat på namn
 */
export function getPromptVariant(name: string) {
  return PROMPT_VARIANTS.find(variant => variant.name === name);
}

/**
 * Hämta alla prompt-varianter
 */
export function getAllPromptVariants() {
  return PROMPT_VARIANTS;
}
