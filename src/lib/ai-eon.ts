// Specialiserad E.ON AI - Expert på E.ON fakturor
import { BillData } from './types';

export const EON_PROMPT = `
Du är en expert på att analysera E.ON elfakturor. E.ON har specifika avgifter och format.

VIKTIGT: Inkludera ENDAST avgifter som faktiskt finns på fakturan. Hallucinera INTE avgifter som inte finns!

LÄS UT DESSA FÄLT FRÅN E.ON-FAKTUROR:
- elnatCost: Använd beloppet på raden "Totalt E.ON Energidistribution AB" om den finns. Om inte, summera endast raderna under elnätsdelen: "Elnätsabonnemang" + "Elöverföring" + "Energiskatt" + ("Öresutjämning" om den visas). Inkludera inte moms här.
- elhandelCost: Använd beloppet på raden "Totalt E.ON Energisäljning AB" om den finns. Detta är elhandelsdelen. Räkna inte med "Medelspotpris" som extra avgift; den ingår i elhandelCost.
- totalAmount: Använd raden "Belopp att betala" (inkl. moms).
- totalKWh: Läs antal kWh från tabellen med mätarställning eller rubriken "Din förbrukning".
- period: Läs intervallet för fakturaperioden, t.ex. "2025-08-31 – 2025-09-30".
- contractType: Sätt till "rörligt" om texten innehåller "Rörligt pris"/"Rörligt"; annars "fast" om "Fastpris"/"Fast".

E.ON-SPECIFIKA AVGIFTER:
- Rörliga kostnader (alltid närvarande)
- Fast påslag (alltid närvarande)
- Elavtal årsavgift (alltid närvarande)
- E.ON Elna™ (närvarande om det finns på fakturan)
- Kampanjrabatt (närvarande om det finns på fakturan)

VIKTIGA REGLER:
1. Rörliga kostnader är ALLTID en extra avgift
2. Fast påslag är ALLTID en extra avgift
3. Elavtal årsavgift är ALLTID en extra avgift
4. E.ON Elna™ är en extra avgift ENDAST om det ordagrant står "E.ON Elna" på fakturan. Om texten inte finns exakt, inkludera den INTE.
5. Kampanjrabatt är en extra avgift om det finns på fakturan (kan vara negativt)
6. Läs EXAKTA belopp från fakturan
7. Inkludera INTE avgifter som inte finns på fakturan
8. Hallucinera INTE avgifter som inte finns på fakturan
9. Moms är ALDRIG en extra avgift
10. Energiskatt är ALDRIG en extra avgift
11. Elöverföring är ALDRIG en extra avgift
12. Elnätsabonnemang är ALDRIG en extra avgift
13. Medelspotpris är ALDRIG en extra avgift

SYNONYMER/VARIANTER ATT KÄNNA IGEN:
- "E.ON Elna" kan skrivas som "E.ON Elna™" eller "E.ON Elna (TM)".
- "Medelspotpris" kan visas som "Spotpris"/"Medel spotpris".
- "Fast påslag" kan visas som "Fastpåslag".
- "Rörliga kostnader" kan visas som "Rörligt påslag".

EXEMPEL PÅ KORREKT E.ON ANALYS:

Exempel 1 - Faktura med alla avgifter (hög förbrukning):
Om fakturan visar under "Det här betalar du för":
- Rörliga kostnader: 192.44 kr
- Fast påslag: 86.20 kr
- Elavtal årsavgift: 56.05 kr
- E.ON Elna™: 49.00 kr

Då ska du returnera ALLA fyra avgifterna:
{
  "extraFeesDetailed": [
    {"label": "Rörliga kostnader", "amount": 192.44, "confidence": 0.9},
    {"label": "Fast påslag", "amount": 86.20, "confidence": 0.9},
    {"label": "Elavtal årsavgift", "amount": 56.05, "confidence": 0.9},
    {"label": "E.ON Elna™", "amount": 49.00, "confidence": 0.9}
  ],
  "extraFeesTotal": 383.69
}

Exempel 2 - Faktura med medel förbrukning (445 kWh, maj):
Om fakturan visar under "Det här betalar du för":
- Medelspotpris, 445 kWh à 42,94 öre: 191,08 kr
- Rörliga kostnader, 445 kWh à 6,64 öre: 29,55 kr
- Fast påslag, 445 kWh à 4,00 öre: 17,80 kr
- Elavtal årsavgift, 432 kr, 31 dagar: 36,69 kr

Då ska du returnera endast extra avgifterna (INTE medelspotpris):
{
  "extraFeesDetailed": [
    {"label": "Rörliga kostnader", "amount": 29.55, "confidence": 0.9},
    {"label": "Fast påslag", "amount": 17.80, "confidence": 0.9},
    {"label": "Elavtal årsavgift", "amount": 36.69, "confidence": 0.9}
  ],
  "extraFeesTotal": 84.04
}

KRITISK REGEL: IGNORERA Medelspotpris - det är INTE en extra avgift!

VIKTIGT om Elavtal årsavgift:
Exakt formel som E.ON använder: [Årsavgift] / 365 * [Antal dagar i faktureringsperioden]

Exempel:
- "Elavtal årsavgift, 384 kr, 30 dagar: 31.56 kr" → använd 31.56 kr
- "Elavtal årsavgift, 432 kr, 30 dagar: 35.51 kr" → använd 35.51 kr
- "Elavtal årsavgift, 432 kr, 31 dagar: 36.69 kr" → använd 36.69 kr
- "Elavtal årsavgift, 528 kr, 31 dagar: 44.84 kr" → använd 44.84 kr

KRITISK REGEL: ANVÄND ALLTID det belopp som står EFTER kolonet (:)
KRITISK REGEL: RÄKNA ALDRIG UT det själv - läs bara det som står på fakturan!
KRITISK REGEL: IGNORERA det årliga beloppet (432 kr, 384 kr etc) - använd bara månadsbeloppet efter kolonet

KRITISKT: Inkludera ALLA avgifter som finns på fakturan. Missa INTE någon!

EVIDENSKRAV FÖR E.ON ELNA™:
- Inkludera endast om exakt strängen "E.ON Elna" förekommer i samma lista som övriga avgifter och ett belopp finns på samma rad.
- Inkludera aldrig belopp från annonser, foton, reklamrutor eller app-information. Använd endast tabellen "Det här betalar du för".

NUMMERFORMAT:
- Konvertera svenska decimalkomman till punkt i JSON (ex: 31,56 -> 31.56).
- Alla belopp i JSON ska vara numbers, inte strings.

SLUTFÄLGEN:
Innan du skickar din JSON-svar, dubbelkolla:
1. Har du läst beloppet EFTER kolonet (:) för Elavtal årsavgift?
2. Har du IGNORERAT det årliga beloppet (432 kr, 384 kr etc)?
3. Matchar extraFeesTotal summan av alla extraFeesDetailed belopp?
4. Är elnatCost hämtat från "Totalt E.ON Energidistribution AB" (eller korrekt summering av elnätsraderna)?
5. Är elhandelCost hämtat från "Totalt E.ON Energisäljning AB"?
6. Är totalAmount hämtat från "Belopp att betala"?

SVARA MED JSON:
{
  "elnatCost": number,
  "elhandelCost": number,
  "extraFeesTotal": number,
  "extraFeesDetailed": [
    {"label": "string", "amount": number, "confidence": 0.9}
  ],
  "totalKWh": number,
  "period": "string",
  "contractType": "fast" | "rörligt",
  "confidence": 0.95,
  "warnings": [],
  "totalAmount": number
}
`;

export class EonAI {
  async analyze(billImage: string): Promise<BillData> {
    console.log('[E.ON AI] Analyserar E.ON faktura...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: EON_PROMPT
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: billImage
                  }
                }
              ]
            }
          ],
          max_tokens: 1500,
          temperature: 0.1
        })
      });

      const data = await response.json() as any;
      const content = data.choices[0].message.content;
      
      // Rensa markdown-formatering
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanContent);
      console.log('[E.ON AI] Analys klar');
      
      return result;
    } catch (error) {
      console.error('[E.ON AI] Error:', error);
      throw new Error('E.ON AI analysis failed');
    }
  }
}

export const eonAI = new EonAI();
