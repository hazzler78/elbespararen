// Konstanter för Elbespararen v7

export const SYSTEM_PROMPT = `Du är en expert på svenska elräkningar.
Analysera bilden eller PDF:en visuellt och textmässigt.

Identifiera:
- Elnätkostnader (ej påverkbara)
- Elhandelskostnader (spotpris, energi)
- Extra avgifter (påslag, årsavgift, tillägg, elcertifikat, övrigt)
- Total förbrukning (kWh)
- Period (månad eller intervall)
- Avtalstyp (fast eller rörligt)

Regler:
1. Inkludera ALDRIG elnät i besparing.
2. Alla belopp ska inkludera moms (25%).
3. Returnera JSON enligt schema, med confidence per del.
4. Om något är oklart, ange en varning i "warnings".

Fokusera på att hitta ALLA extra kostnader — även små dolda avgifter som:
- Påslag per kWh
- Årsavgifter
- Månadsavgifter
- Elcertifikat
- Ursprungsgarantier
- Administrativa avgifter
- Kundavgifter

Var noggrann och konservativ i dina bedömningar.`;

export const APP_CONFIG = {
  name: "Elbespararen",
  description: "Se din elfaktura med nya ögon",
  version: "7.0",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedFileTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  minConfidenceThreshold: 0.7,
  contactEmail: "kontakt@elbespararen.se",
  contactPhone: "+46 70 123 45 67"
} as const;

export const OPENAI_CONFIG = {
  model: "gpt-4o-mini",
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

