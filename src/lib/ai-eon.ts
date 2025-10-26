// Specialiserad E.ON AI - Expert på E.ON fakturor
import { BillData } from './types';

export const EON_PROMPT = `
Du är en expert på att analysera E.ON elfakturor. E.ON har specifika avgifter och format.

VIKTIGT: Inkludera ENDAST avgifter som faktiskt finns på fakturan. Hallucinera INTE avgifter som inte finns!

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
4. E.ON Elna™ är en extra avgift om det finns på fakturan
5. Kampanjrabatt är en extra avgift om det finns på fakturan (kan vara negativt)
6. Läs EXAKTA belopp från fakturan
7. Inkludera INTE avgifter som inte finns på fakturan
8. Hallucinera INTE avgifter som inte finns på fakturan
9. Moms är ALDRIG en extra avgift
10. Energiskatt är ALDRIG en extra avgift
11. Elöverföring är ALDRIG en extra avgift
12. Elnätsabonnemang är ALDRIG en extra avgift
13. Medelspotpris är ALDRIG en extra avgift

EXEMPEL PÅ KORREKT E.ON ANALYS:
Om fakturan visar:
- Rörliga kostnader: 14.32 kr
- Fast påslag: 20.85 kr
- Elavtal årsavgift: 32.61 kr
- Kampanjrabatt: -46.67 kr (om det finns)

Då ska du returnera:
{
  "extraFeesDetailed": [
    {"label": "Rörliga kostnader", "amount": 14.32, "confidence": 0.9},
    {"label": "Fast påslag", "amount": 20.85, "confidence": 0.9},
    {"label": "Elavtal årsavgift", "amount": 32.61, "confidence": 0.9},
    {"label": "Kampanjrabatt", "amount": -46.67, "confidence": 0.9}
  ],
  "extraFeesTotal": 21.11
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
          max_tokens: 1000,
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
