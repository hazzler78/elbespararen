// Specialiserad Vattenfall AI - Expert på Vattenfall fakturor
import { BillData } from './types';

export const VATTENFALL_PROMPT = `
Du är en expert på att analysera Vattenfall elfakturor. Vattenfall har specifika avgifter och format.

VATTENFALL-SPECIFIKA AVGIFTER (ALDRIG ANDRA):
- Rörliga kostnader (alltid närvarande)
- Fast påslag spot (alltid närvarande)
- Fast påslag elcertifikat (alltid närvarande)
- Årsavgift (alltid närvarande)
- Kampanjrabatt (kan vara negativt)

VIKTIGA REGLER:
1. Rörliga kostnader är ALLTID en extra avgift
2. Fast påslag spot är ALLTID en extra avgift
3. Fast påslag elcertifikat är ALLTID en extra avgift
4. Årsavgift är ALLTID en extra avgift
5. Kampanjrabatt kan vara negativt (rabatt)
6. Läs EXAKTA belopp från fakturan
7. Moms är ALDRIG en extra avgift
8. Energiskatt är ALDRIG en extra avgift
9. Elöverföring är ALDRIG en extra avgift
10. Elnätsabonnemang är ALDRIG en extra avgift
11. Medelspotpris är ALDRIG en extra avgift

EXEMPEL PÅ KORREKT VATTENFALL ANALYS:
Om fakturan visar:
- Rörliga kostnader: 65.87 kr
- Fast påslag spot: 54.18 kr
- Fast påslag elcertifikat: 10.84 kr
- Årsavgift: 35.51 kr
- Kampanjrabatt: -40.00 kr

Då ska du returnera:
{
  "extraFeesDetailed": [
    {"label": "Rörliga kostnader", "amount": 65.87, "confidence": 0.9},
    {"label": "Fast påslag spot", "amount": 54.18, "confidence": 0.9},
    {"label": "Fast påslag elcertifikat", "amount": 10.84, "confidence": 0.9},
    {"label": "Årsavgift", "amount": 35.51, "confidence": 0.9},
    {"label": "Kampanjrabatt", "amount": -40.00, "confidence": 0.9}
  ],
  "extraFeesTotal": 126.40
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

export class VattenfallAI {
  async analyze(billImage: string): Promise<BillData> {
    console.log('[Vattenfall AI] Analyserar Vattenfall faktura...');
    
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
              content: VATTENFALL_PROMPT
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
      console.log('[Vattenfall AI] Analys klar');
      
      return result;
    } catch (error) {
      console.error('[Vattenfall AI] Error:', error);
      throw new Error('Vattenfall AI analysis failed');
    }
  }
}

export const vattenfallAI = new VattenfallAI();
