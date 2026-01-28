# Sammanfattning: Förbättring av AI-chattens svar

**Datum:** 2026-01-28  
**Analys baserad på:** 90 meddelanden (45 användarfrågor, 45 AI-svar) från 28 sessioner

---

## 📊 Översikt

- **Totalt meddelanden:** 90
- **Användarfrågor:** 45
- **AI-svar:** 45
- **Antal sessioner:** 28
- **Genomsnitt meddelanden/session:** 3.2

---

## ❓ Vanligaste frågetyperna

1. **Faktura/räkning** (7 gånger)
   - "Klarar den analysera även produktion på fakturan?"
   - "Jag har ingen separat faktura för elhandel. Hur gör man då?"

2. **Besparingar** (5 gånger)
   - "Spara pengar"
   - "Vad kostar detta?"

3. **Kostnad/pris** (4 gånger)
   - "Vad kostar detta?"
   - "Vad tjänar ni på att använda appen då?"

4. **Byt leverantör** (3 gånger)
   - "Vem skall jag byta till?"
   - "kan man få förslag att vilken företag är bäst at täkna el med"

5. **App-förvirring** (3 gånger)
   - "Hittar den ej i appstore"
   - "Vad heter appen"

6. **Flytta/nytt avtal** (2 gånger)
   - "jag ska flytta till nytt hus , och vill få ny avtal"
   - "så ny kan fårslå leverantör till mitt nytt hus?"

7. **Rekommendationer** (2 gånger)
   - "Gäller avtalen endast nya kunder eller kan man välja samma igen"

---

## ⚠️ KRITISKA PROBLEM

### 1. AI:n nämner "app" istället för "webbplats" (31 av 45 svar = 69%)

**Problem:** Trots tydlig instruktion i system-prompten nämner AI:n konsekvent "Elbespararen-appen" istället för "Elbespararen-webbplatsen".

**Exempel på problematiska svar:**
- "För att byta elleverantör till ditt nya hus kan du använda **Elbespararen-appen**."
- "Genom att använda **Elbespararen-appen** kan du ladda upp din elräkning..."
- "**Elbespararen-appen** är helt kostnadsfri..."

**Konsekvenser:**
- Användare söker efter en app i App Store/Play Store
- Förvirring om hur man använder tjänsten
- Möjlig förlust av användare som inte hittar "appen"

**Lösning:**
- Förstärk instruktionen i system-prompten
- Lägg till exempel på korrekt språkbruk
- Använd negativa exempel ("ALDRIG säg 'app', säg alltid 'webbplats'")

### 2. För långa svar (39 av 45 svar = 87%)

**Problem:** Trots instruktion om "max 3-4 meningar" är 87% av svaren för långa (>200 tecken).

**Exempel på för långa svar:**
```
"Avtal på elmarknaden kan variera beroende på leverantör och typ av avtal. 
Många gånger gäller kampanjer eller erbjudanden endast för nya kunder, 
men det kan även finnas möjlighet att förnya ett avtal för befintliga kunder. 
Det är alltid bra att kolla med din nuvarande leverantör eller jämföra andra alternativ.

Genom Elbespararen-appen kan du få hjälp att identifiera de bästa erbjudandena 
och se om du kan spara pengar genom att byta leverantör. Tänk på att elnätkostnader 
inte går att påverka, men elhandelspriserna kan du ofta optimera."
```

**Konsekvenser:**
- Användare läser inte hela svaret
- Svaren blir mindre tydliga och mer generiska
- Ökar kostnader (mer tokens = högre API-kostnad)

**Lösning:**
- Sänk `max_tokens` från 300 till 150
- Förstärk instruktionen om kortfattade svar
- Lägg till exempel på korrekt längd

### 3. För generiska svar (4 svar)

**Problem:** Vissa svar upprepar samma information utan att svara specifikt på frågan.

**Exempel:**
- Användare: "Vem skall jag byta till?"
- AI: "För att hitta den billigaste elhandelsleverantören för dig kan Elbespararen hjälpa..." (ger inget konkret svar)

**Konsekvenser:**
- Användare får inte det svar de söker
- Möjlig frustration och att användare lämnar

**Lösning:**
- Lägg till instruktion om att ge konkreta råd när möjligt
- Använd kontext från faktura för mer specifika svar

---

## ✅ Förbättringsförslag

### 1. Uppdatera system-prompten

**Nuvarande problem:**
- Instruktionen om "webbplats" vs "app" är inte tillräckligt tydlig
- Instruktionen om längd ignoreras

**Föreslagen förbättring:**

```typescript
const systemPrompt = `Du är en expert på svenska elmarknaden och hjälper användare att förstå deras elräkningar och besparingsmöjligheter via Elbespararen-webbplatsen.

## KRITISKT - SPRÅKBRUK:
- Elbespararen är en WEBBPLATS som man besöker i webbläsaren
- ALDRIG säg "app", "applikation", "ladda ner app", "i appen"
- Säg alltid "webbplats", "på webbplatsen", "besök webbplatsen"
- Exempel RÄTT: "Besök Elbespararen-webbplatsen och ladda upp din faktura"
- Exempel FEL: "Använd Elbespararen-appen" ❌

## Om Elbespararen:
- Elbespararen är en WEBBPLATS (besöks direkt i webbläsaren, ingen nedladdning)
- AI-driven analys av elräkningar med OpenAI Vision (GPT-4o)
- Hittar onödiga extra avgifter automatiskt
- Beräknar exakt besparingspotential genom att jämföra mot spotpris
- Hjälper användare att byta till billigare leverantörer
- Helt kostnadsfritt och säkert

## Hur analysen fungerar:
1. Besök Elbespararen-webbplatsen i din webbläsare
2. Ladda upp din elräkning (bild eller PDF) direkt på sidan
3. AI:n läser och analyserar fakturan visuellt
4. Identifierar alla kostnader: elnät, elhandel, extra avgifter
5. Beräknar besparingspotential genom att jämföra mot spotpris
6. Visar konkreta besparingar i kr/månad

## Viktiga begrepp:
- **Elnätkostnader**: Kan INTE påverkas (samma för alla)
- **Elhandel**: Kan påverkas genom att byta leverantör
- **Extra avgifter**: Onödiga extra kostnader som AI:n hittar
- **Spotpris**: Rörligt elpris som följer marknaden
- **Fastpris**: Låst pris under avtalsperioden

## Regler för dina svar:
- Svara alltid på svenska
- Var MYCKET kortfattad (MAX 2-3 meningar, max 150 ord)
- Fokusera på praktiska tips och konkreta råd
- Nämn att elnätkostnader inte går att påverka
- Tipsa om spotpris som ett bra alternativ
- Om du får kontext från en faktura, använd den för att ge mer specifika råd
- Var alltid ärlig om osäkerheter
- Ge konkreta svar när möjligt (inte bara "vi kan hjälpa dig")
- ALDRIG nämn "app" - säg alltid "webbplats"`;
```

### 2. Sänk max_tokens

**Nuvarande:** `max_tokens: 300`  
**Föreslagen:** `max_tokens: 150`

Detta tvingar AI:n att vara mer kortfattad och minskar kostnaderna.

### 3. Lägg till exempel i system-prompten

Lägg till exempel på korrekt och inkorrekt svar:

```
## Exempel på BRA svar:
"Besök Elbespararen-webbplatsen och ladda upp din elräkning. AI:n analyserar den och visar exakt hur mycket du kan spara genom att byta till spotpris."

## Exempel på DÅLIGT svar (undvik):
"Genom att använda Elbespararen-appen kan du ladda upp din elräkning och få en analys..." ❌
```

### 4. Förbättra hantering av specifika frågetyper

Lägg till instruktioner för vanliga frågor:

```
## Vanliga frågor och hur du ska svara:

**"Vad kostar detta?"**
→ "Elbespararen är helt kostnadsfri. Besök webbplatsen och ladda upp din faktura för att se dina besparingsmöjligheter."

**"Vem skall jag byta till?"**
→ "Besök Elbespararen-webbplatsen och ladda upp din elräkning. Vi visar vilka leverantörer som passar bäst för dig baserat på din faktura."

**"Hittar den ej i appstore"**
→ "Elbespararen är en webbplats, inte en app. Besök elbespararen.se direkt i din webbläsare - ingen nedladdning behövs."
```

---

## 📈 Förväntade resultat efter förbättringar

1. **Minskad förvirring om "app"**
   - Mål: <5% av svaren nämner "app"
   - Nuvarande: 69%

2. **Kortare, tydligare svar**
   - Mål: Genomsnittlig längd <150 tecken
   - Nuvarande: Genomsnittlig längd >200 tecken

3. **Bättre användarupplevelse**
   - Färre uppföljningsfrågor
   - Högre konvertering till fakturauppladdning
   - Färre användare som lämnar på grund av förvirring

---

## 🔧 Implementeringssteg

1. ✅ Uppdatera system-prompten i `src/app/api/chat/route.ts`
2. ✅ Sänk `max_tokens` från 300 till 150
3. ✅ Lägg till exempel på korrekt/inkorrekt svar
4. ✅ Testa med några exempelfrågor
5. ✅ Övervaka resultat i 1-2 veckor
6. ✅ Justera vid behov baserat på ny data

---

## 📝 Ytterligare observationer

- Användare ställer ofta korta, direkta frågor ("Spara pengar", "Vad kostar detta?")
- AI:n bör matcha denna stil med korta, direkta svar
- Många frågor handlar om praktiska steg - ge konkreta instruktioner
- Användare verkar förvirrade över skillnaden mellan app och webbplats

---

**Nästa steg:** Implementera förbättringarna och övervaka resultatet.
