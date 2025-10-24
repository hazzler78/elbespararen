// Konstanter för Elbespararen v7

export const SYSTEM_PROMPT = `Du är en expert på svenska elräkningar.
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

export const APP_CONFIG = {
  name: "Elbespararen",
  description: "Se din elfaktura med nya ögon",
  version: "7.0",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedFileTypes: ["image/jpeg", "image/png", "image/webp"] as string[],
  minConfidenceThreshold: 0.7,
  contactEmail: "kontakt@elbespararen.se",
  contactPhone: "+46 70 123 45 67"
} as const;

export const OPENAI_CONFIG = {
  model: "gpt-4o",
  temperature: 0,
  maxTokens: 2000
} as const;

export const ROUTES = {
  home: "/",
  upload: "/upload",
  confirm: "/confirm",
  result: "/result",
  admin: "/admin"
} as const;

