// Generell AI - För okända leverantörer
import { BillData } from './types';

export const GENERAL_PROMPT = `
Du är en expert på att analysera svenska elfakturor från okända leverantörer. Du måste identifiera ALLA extra avgifter som kunden kan undvika genom att byta leverantör.

GRUNDLÄGGANDE REGLER (Följ i ordning):
1. Hitta total belopp att betala (totalAmount) - ofta "Summa Elhandel", "Att betala", "Belopp att betala"
2. Identifiera elnätskostnad (elnatCost) - oftast större belopp (~500-600 kr), kan vara separerat avsnitt
3. Identifiera grundläggande energikostnad (elhandelCost) - spotpris/medelspotpris/grundpris
4. ⚠️ KRITISK STEG: Sök SPECIFIKT efter "Fast påslag" i kostnadstabellen - detta är en extra avgift som ofta missas!
5. Identifiera ALLA andra extra avgifter som kunden kan undvika - detta är KRITISKT!

EXTRA AVGIFTER (Kundens extra kostnader) - Inkludera ALLA:

⚠️ MEST VIKTIGA ATT INTE MISSA (sök efter dessa FÖRST):
1. "Fast påslag" - HÖGSTA PRIORITET! Sök VARJE gång efter dessa varianter:
   - "Fast påslag" (mest vanligt)
   - "Fastpåslag" (utan mellanslag)
   - "Påslag" (kort variant, men INTE "Medelspotpris" eller "Spotpris")
   - Kan ofta visas som "Fast påslag, XXX kWh" eller liknande
   - Detta är EN EXTRA AVGIFT som kunden kan undvika - INKLUDERA ALLTID om det finns!

2. "Fast månadsavg." / "Månadsavgift" - Inkludera alltid om det finns
3. "Rörliga kostnader" - Inkludera alltid om det finns

ANDRA VANLIGA EXTRA AVGIFTER:
- Elcertifikat / Elcertifikatavgift
- Elavtal årsavgift / Årsavgift / Årsavgift elavtal
- Miljöpaket / Miljöavgift / Miljöpaketavgift
- Fossilfri / Fossilfriavgift
- Priskollen / Priskollavgift
- Serviceavgift / Serviceavgifter
- Tillägg / Övriga avgifter / Ytterligare avgifter
- Rabatt / Kampanjrabatt (kan vara negativt)
- Adminavgift / Administrativ avgift
- Uppdragsavgift / Hanteringsavgift

VIKTIGT: Om du ser en kostnadstabell eller lista med olika kostnadsposter, läs VARJE rad noggrant. 
BÖRJA med att leta efter "Fast påslag" - det är en av de vanligaste extra avgifterna!
Extra avgifter kan ha många olika namn - var noga med att identifiera ALLA!

ALDRIG INKLUDERA SOM EXTRA AVGIFTER:
- Moms / Moms 25% (Moms är skatt, inte avgift)
- Energiskatt (grundläggande skatt)
- Elnät / Elnätskostnad / Elnätsavgift (grundläggande nätkostnad)
- Grundläggande energikostnad (Medelspotpris / Spotpris / Grundpris / El timmätt)
- Öresutjämning (tekniskt justering)
- Elöverföring (del av elnät)
- Elnätsabonnemang (del av elnät)

LÄS EXAKTA BELOPP:
- Läs belopp direkt från fakturan - använd EXAKT det belopp som står
- Kolla kostnadstabeller, listor med priser, eller sammanfattningar
- Om det finns en tabell med kolumner (typ "Beskrivning", "Antal", "Pris", "Summa"), läs från "Summa"-kolumnen
- Multiplicera ALDRIG själv - använd bara det som redan står beräknat

EXEMPEL PÅ KORREKT ANALYS:

Exempel 1 - Faktura med flera avgifter (VIKTIGT: Observera att "Fast påslag" INKLUDERAS):
Om fakturan visar i en kostnadstabell:
- Fast månadsavg.: 31.20 kr
- Medelspotpris, 106 kWh: 5.29 kr
- Fast påslag, 106 kWh: 21.20 kr  ← OBS: Detta är en EXTRA AVGIFT, inte grundläggande kostnad!
- Rörliga kostnader, 106 kWh: 4.60 kr
- Moms 25%: 15.58 kr

Då ska du returnera (INTE medelspotpris eller moms, MEN INKLUDERA Fast påslag):
{
  "elhandelCost": 5.29,
  "extraFeesDetailed": [
    {"label": "Fast månadsavg.", "amount": 31.20, "confidence": 0.9},
    {"label": "Fast påslag", "amount": 21.20, "confidence": 0.9},  ← KRITISKT: Inkludera detta!
    {"label": "Rörliga kostnader", "amount": 4.60, "confidence": 0.9}
  ],
  "extraFeesTotal": 57.00
}

VIKTIGT: "Fast påslag" är INTE samma sak som "Medelspotpris". 
- Medelspotpris = grundläggande energikostnad (elhandelCost) - INKLUDERA INTE i extraFeesDetailed
- Fast påslag = extra avgift UTÖVER spotpriset - INKLUDERA ALLTID i extraFeesDetailed om det finns!

Exempel 2 - Faktura med månadsavgift och påslag:
Om fakturan visar:
- Månadsavgift: 39.20 kr
- Påslag: 11.62 kr
- Medelspotpris: 191.08 kr

Då ska du returnera:
{
  "elhandelCost": 191.08,
  "extraFeesDetailed": [
    {"label": "Månadsavgift", "amount": 39.20, "confidence": 0.9},
    {"label": "Påslag", "amount": 11.62, "confidence": 0.9}
  ],
  "extraFeesTotal": 50.82
}

KRITISKA REGLER FÖR EXTRA AVGIFTER:
Extra avgifter är ENDAST avgifter som leverantören lägger på UTÖVER grundläggande energikostnad.
Extra avgifter är ALLTID mindre än totalAmount och utgör vanligtvis 10-50% av totalAmount.

PRIORITERADE EXTRA AVGIFTER (MÅSTE INKLUDERAS OM DE FINNS):
1. "Fast påslag" - Detta är en EXTREM viktig extra avgift som MÅSTE inkluderas om den finns på fakturan!
   - Sök efter: "Fast påslag", "Fastpåslag", "Påslag" (men INTE "Medelspotpris" eller "Spotpris")
   - Detta är en avgift som läggs på UTÖVER spotpriset - kunden kan undvika den genom att byta leverantör
   - Om du ser "Fast påslag" i kostnadstabellen - inkludera den ALLTID i extraFeesDetailed
   
2. "Fast månadsavg." / "Månadsavgift" - Om den finns i ELHANDELS-sektionen, inkludera den ALLTID
3. "Rörliga kostnader" / "Rörligt påslag" - Om den finns i ELHANDELS-sektionen, inkludera den ALLTID

ALDRIG INKLUDERA SOM EXTRA AVGIFTER:
4. Medelspotpris/Spotpris är ALDRIG en extra avgift - det är grundläggande energikostnad (elhandelCost)
5. Moms är ALDRIG en extra avgift - ignorera den helt
6. Elnät är ALDRIG en extra avgift - det är elnatCost
7. Inkludera ALDRIG avgifter från andra leverantörer (t.ex. "E.ON Elna™" om fakturan INTE är från E.ON)
8. Varje avgift MÅSTE ha en tydlig label - inkludera INTE okända poster utan label

MATEMATISK VALIDERING (KRITISKT):
- extraFeesTotal + elhandelCost + elnatCost ≈ totalAmount (med tolerans för moms)
- extraFeesTotal är VANLIGTVIS mindre än totalAmount (oftast 10-50% av totalAmount)
- Om extraFeesTotal > totalAmount, har du misskategoriserat något - börja om!
- Summera extraFeesDetailed: alla belopp ska adderas till extraFeesTotal

FÖRE SLUTFÄLGEN - Dubbelkolla (KRITISK CHECKLISTA - FÖLJ I ORDNING):

STEG 1-3: Grundläggande identifiering
1. Har jag identifierat totalAmount korrekt från fakturan?
2. Har jag identifierat elnatCost (oftast större belopp, ~500-600 kr)?
3. Har jag identifierat elhandelCost (medelspotpris/spotpris)?

STEG 4: ⚠️ KRITISK KONTROLL - "Fast påslag" (MÅSTE göras varje gång!)
4. Har jag sökt SPECIFIKT efter "Fast påslag" i kostnadstabellen?
   - Gå igenom VARJE rad i kostnadstabellen/listan
   - Leta efter ordet "Fast" följt av "påslag" eller "Påslag" (med eller utan mellanslag)
   - Om fakturan innehåller en kostnadstabell, läs VARJE rad och kontrollera om någon rad innehåller "Fast påslag"
   - "Fast påslag" kan stå ensamt eller tillsammans med kWh-belopp, t.ex. "Fast påslag, 106 kWh: 21.20 kr"
   - Om jag hittar "Fast påslag" - är det INKLUDERAT i extraFeesDetailed?
   - Om "Fast påslag" finns på fakturan men INTE i min lista över extra avgifter - JAG HAR GJORT ETT FEL!
   - Om "Fast påslag" saknas, gå tillbaka och sök igen i kostnadstabellen!

STEG 5-6: Andra extra avgifter
5. Har jag INKLUDERAT Fast månadsavg./Månadsavgift om den finns i ELHANDELS-sektionen?
6. Har jag INKLUDERAT Rörliga kostnader om de finns i ELHANDELS-sektionen?

STEG 7-10: Exkluderingskontroller
7. Har jag EXKLUDERAT Medelspotpris/Spotpris (det är elhandelCost, INTE extra avgift)?
8. Har jag EXKLUDERAT Moms (det är skatt)?
9. Har jag EXKLUDERAT Elnät (det är elnatCost)?
10. Har jag EXKLUDERAT avgifter från andra leverantörer?

STEG 11-13: Validering
11. Matchar extraFeesTotal summan av alla extraFeesDetailed belopp?
12. Är extraFeesTotal < totalAmount? (om inte, har jag misskategoriserat något!)
13. Är (elnatCost + elhandelCost + extraFeesTotal) ≈ totalAmount? (med tolerans för moms)

SLUTKONTROLL: Om jag INTE är 100% säker på att jag har sökt efter "Fast påslag" i VARJE kostnadstabell på fakturan, börja om analysen från början!

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
                  type: 'text',
                  text: `Analysera denna svenska elfaktura noggrant. Identifiera ALLA kostnader och hitta ALLA extra avgifter som kunden kan undvika genom att byta leverantör. 

KRITISK INSTRUKTION: Sök SPECIFIKT efter "Fast påslag" i kostnadstabellen. Detta är en vanlig extra avgift som MÅSTE inkluderas om den finns. Läs VARJE rad i kostnadstabellen/listan och kontrollera att "Fast påslag" inte missas.

Steg för steg:
1. Identifiera totalAmount (belopp att betala)
2. Identifiera elnatCost (elnätskostnad)
3. Identifiera elhandelCost (medelspotpris/spotpris)
4. SÖK SPECIFIKT efter "Fast påslag" i kostnadstabellen - detta är en extra avgift!
5. Identifiera alla andra extra avgifter
6. Dubbelkolla att "Fast påslag" är inkluderad om den finns på fakturan`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: billImage,
                    detail: 'high'
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
      console.log('[General AI] Analys klar');
      
      return result;
    } catch (error) {
      console.error('[General AI] Error:', error);
      throw new Error('General AI analysis failed');
    }
  }
}

export const generalAI = new GeneralAI();
