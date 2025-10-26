// Generell AI - För okända leverantörer
import { BillData } from './types';

export const GENERAL_PROMPT = `
Du är en expert på att analysera svenska elfakturor från okända leverantörer.

GRUNDLÄGGANDE REGLER:
1. Hitta total belopp att betala (totalAmount)
2. Identifiera elnätskostnad (elnatCost) - oftast större belopp
3. Identifiera grundläggande energikostnad (elhandelCost) - spotpris/medelspotpris
4. Identifiera extra avgifter som kunden kan undvika

EXTRA AVGIFTER (Kundens extra kostnader):
- Elcertifikat, Månadsavgift, Priskollen, Påslag
- Rörliga kostnader, Fast påslag, Elavtal årsavgift
- Miljöpaket, Fossilfri, Rabatt, Kampanjrabatt
- Tillägg, Övriga avgifter, Serviceavgifter
- Inkludera även 0 kr-avgifter om de är tydligt märkta

ALDRIG INKLUDERA SOM EXTRA AVGIFTER:
- Moms (Moms är skatt, inte avgift)
- Energiskatt (grundläggande skatt)
- Elnät (grundläggande nätkostnad)
- Grundläggande energikostnad (spotpris/medelspotpris)
- Öresutjämning (tekniskt justering)

VIKTIGA INSTRUKTIONER:
- Läs EXAKTA belopp från fakturan
- Summera alla extra avgifter korrekt
- Inkludera negativa belopp (rabatter)
- Var försiktig med att inte inkludera grundläggande kostnader

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

export class GeneralAI {
  async analyze(billImage: string): Promise<BillData> {
    console.log('[General AI] Analyserar okänd leverantör...');
    
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
              content: GENERAL_PROMPT
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
      console.log('[General AI] Analys klar');
      
      return result;
    } catch (error) {
      console.error('[General AI] Error:', error);
      throw new Error('General AI analysis failed');
    }
  }
}

export const generalAI = new GeneralAI();
