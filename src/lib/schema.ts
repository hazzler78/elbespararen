// OpenAI JSON Schema för strukturerad output

export const BILL_SCHEMA = {
  type: "object",
  properties: {
    elnatCost: {
      type: "number",
      description: "Elnätkostnad (ej påverkbar, alltid exkluderad från besparing)"
    },
    elhandelCost: {
      type: "number",
      description: "Elhandelskostnad (spotpris, energi)"
    },
    extraFeesTotal: {
      type: "number",
      description: "Summa av alla extra avgifter"
    },
    extraFeesDetailed: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "Beskrivning av avgiften (t.ex. 'Påslag', 'Årsavgift', 'Elcertifikat')"
          },
          amount: {
            type: "number",
            description: "Belopp inkl. moms"
          },
          confidence: {
            type: "number",
            description: "Säkerhet 0-1 (0.9 = 90%)"
          }
        },
        required: ["label", "amount", "confidence"],
        additionalProperties: false
      }
    },
    totalKWh: {
      type: "number",
      description: "Total förbrukning i kWh"
    },
    period: {
      type: "string",
      description: "Period (t.ex. 'Jan 2025', '2025-01-01 till 2025-01-31')"
    },
    contractType: {
      type: "string",
      enum: ["fast", "rörligt"],
      description: "Avtalstyp"
    },
    confidence: {
      type: "number",
      description: "Övergripande säkerhet för hela analysen (0-1)"
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Varningar om något är oklart"
    },
    totalAmount: {
      type: "number",
      description: "Total belopp att betala (exakt som det står på fakturan)"
    }
  },
  required: ["elnatCost", "elhandelCost", "extraFeesTotal", "extraFeesDetailed", "totalKWh", "period", "contractType", "confidence", "warnings", "totalAmount"],
  additionalProperties: false
} as const;

