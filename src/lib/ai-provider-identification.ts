// Leverantörsidentifiering AI - Känner igen vilken leverantör det är
import { BillData } from './types';

export interface ProviderIdentification {
  provider: string;
  confidence: number;
  reasoning: string;
}

export const PROVIDER_IDENTIFICATION_PROMPT = `
Du är en expert på att identifiera svenska elhandelsleverantörer från fakturor.

ANALYSERA FÖLJANDE:
1. Leverantörsnamn/logotyp
2. Karakteristiska avgifter och termer
3. Fakturaformat och layout
4. Specifika nyckelord

SVARA MED JSON:
{
  "provider": "leverantörsnamn",
  "confidence": 0.0-1.0,
  "reasoning": "varför du tror det är denna leverantör"
}

KÄNDA LEVERANTÖRER:
- Fortum: "Fortum", "Elcertifikat", "Månadsavgift", "Fossilfri", "Priskollen"
- E.ON: "E.ON", "Rörliga kostnader", "Fast påslag", "Elavtal årsavgift", "E.ON Elna™"
- Vattenfall: "Vattenfall", "Fast påslag spot", "Årsavgift", "Kampanjrabatt"
- Greenely: "Greenely", "Grön el", "Miljöpaket"
- Tibber: "Tibber", "Spotpris", "Pulspåslag"
- Cheap Energy: "Cheap Energy", "Billig el"

Om du inte känner igen leverantören, svara med "unknown".
`;

export async function identifyProvider(billImage: string): Promise<ProviderIdentification> {
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
            content: PROVIDER_IDENTIFICATION_PROMPT
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
        max_tokens: 200,
        temperature: 0.1
      })
    });

    const data = await response.json() as any;
    const content = data.choices[0].message.content;
    
    try {
      // Rensa markdown-formatering
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanContent);
      return {
        provider: result.provider || 'unknown',
        confidence: result.confidence || 0.0,
        reasoning: result.reasoning || 'Ingen reasoning tillgänglig'
      };
    } catch (parseError) {
      // Fallback om JSON parsing misslyckas
      return {
        provider: 'unknown',
        confidence: 0.0,
        reasoning: 'Kunde inte parsa AI-svar'
      };
    }
  } catch (error) {
    console.error('[Provider Identification] Error:', error);
    return {
      provider: 'unknown',
      confidence: 0.0,
      reasoning: 'API-fel vid identifiering'
    };
  }
}
