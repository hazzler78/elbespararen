// Specialiserad Fortum AI - Expert på Fortum fakturor
import { BillData } from './types';

export const FORTUM_PROMPT = `
Du är en expert på att analysera Fortum elfakturor. Fortum har specifika avgifter och format.

FORTUM-SPECIFIKA AVGIFTER:
- Elcertifikat (alltid närvarande)
- Månadsavgift (alltid närvarande)
- Rabatt Månadsavgift (kan vara negativt)
- Påslag (alltid närvarande)
- Fossilfri (kan vara 0 kr)
- Priskollen (närvarande om det finns på fakturan)
- Miljöpaket (kan vara närvarande)
- Miljöpaket, påslag förnybar el (kan vara närvarande)

VIKTIGA REGLER:
1. Elcertifikat är ALLTID en extra avgift
2. Månadsavgift är ALLTID en extra avgift
3. Rabatt Månadsavgift kan vara negativt (rabatt)
4. Påslag är ALLTID en extra avgift
5. Fossilfri är ALLTID en extra avgift (även om 0 kr)
6. Priskollen är en extra avgift ENDAST om det finns på fakturan
7. Miljöpaket är ALLTID en extra avgift
8. Miljöpaket, påslag förnybar el är ALLTID en extra avgift
9. Läs EXAKTA belopp från fakturan
10. Moms är ALDRIG en extra avgift
11. Energiskatt är ALDRIG en extra avgift
12. Elöverföring är ALDRIG en extra avgift
13. Elnätsabonnemang är ALDRIG en extra avgift
14. Medelspotpris är ALDRIG en extra avgift

EXEMPEL PÅ KORREKT FORTUM ANALYS:
Om fakturan visar:
- Elcertifikat: 3.26 kr
- Månadsavgift: 39.20 kr
- Fossilfri: 0.00 kr
- (Ingen Priskollen på denna faktura)

Då ska du returnera:
{
  "extraFeesDetailed": [
    {"label": "Elcertifikat", "amount": 3.26, "confidence": 0.9},
    {"label": "Månadsavgift", "amount": 39.20, "confidence": 0.9},
    {"label": "Fossilfri", "amount": 0.00, "confidence": 0.9}
  ],
  "extraFeesTotal": 42.46
}

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

export class FortumAI {
  async analyze(billImage: string): Promise<BillData> {
    console.log('[Fortum AI] Analyserar Fortum faktura...');
    
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
              content: FORTUM_PROMPT
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
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      const data = await response.json() as any;
      const content = data.choices[0].message.content;
      
      // Rensa markdown-formatering
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanContent);
      console.log('[Fortum AI] Analys klar');
      
      return result;
    } catch (error) {
      console.error('[Fortum AI] Error:', error);
      throw new Error('Fortum AI analysis failed');
    }
  }
}

export const fortumAI = new FortumAI();
