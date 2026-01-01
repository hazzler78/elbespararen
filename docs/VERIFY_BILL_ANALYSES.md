# ✅ Verifiera fakturaanalyser och admin-statistik

Denna guide hjälper dig att verifiera att fakturaanalyser sparas korrekt och att du kan se statistik i admin-gränssnittet.

## 📋 Förutsättningar

1. ✅ Migration `0032_create_bill_analyses.sql` är körd i din databas
2. ✅ Applikationen är deployad och körs
3. ✅ Du har tillgång till admin-lösenordet: `grodan2025`

---

## 🧪 Steg 1: Testa att ladda upp en faktura

### 1.1 Gå till upload-sidan
- Öppna din applikation (t.ex. `https://din-app.pages.dev` eller `http://localhost:3000`)
- Navigera till `/upload` eller klicka på "Analysera min faktura" på startsidan

### 1.2 Ladda upp en faktura
- Välj en bildfil av en elfaktura (JPEG, PNG eller WebP)
- Klicka på "Analysera faktura"
- Vänta tills analysen är klar (5-10 sekunder)

### 1.3 Verifiera att analysen sparas
**Kontrollera i browser console (F12):**
```javascript
// Du bör se loggar som:
[parse-bill-v3] Analys klar. Confidence: 95%
[parse-bill-v3] Analys sparad i databasen för admin-granskning
```

**Eller kontrollera Network-fliken:**
- Sök efter request till `/api/parse-bill-v3`
- Kontrollera att response är `200 OK`
- Response ska innehålla `success: true` och `data` med fakturaanalys

---

## 🔐 Steg 2: Logga in på admin-sidan

### 2.1 Navigera till admin
- Gå till `/admin/bill-analyses` i din webbläsare
- Eller gå till `/admin` och klicka på "Fakturaanalyser" i menyn

### 2.2 Logga in
- Ange lösenord: `grodan2025`
- Klicka på "Logga in"

---

## 📊 Steg 3: Verifiera statistik

### 3.1 Kontrollera översiktsstatistik
På admin-sidan bör du se **5 statistik-boxar** överst:

1. **Totalt** - Antal analyser som sparats
2. **Väntar** - Analyser som inte validerats ännu (status: `pending`)
3. **Korrekt** - Analyser markerade som korrekta
4. **Felaktig** - Analyser markerade som felaktiga
5. **Granska** - Analyser som behöver granskas

**Första gången:**
- "Totalt" bör visa antal fakturor du har laddat upp
- "Väntar" bör visa samma antal (alla nya analyser börjar som `pending`)

### 3.2 Kontrollera tabellen
Du bör se en tabell med alla fakturaanalyser som visar:
- ✅ Filnamn
- ✅ Period (från fakturan)
- ✅ Förbrukning (kWh)
- ✅ Total belopp
- ✅ Besparing (beräknad)
- ✅ Confidence (%)
- ✅ Status (Väntar/Korrekt/Felaktig/Granska)

---

## 🔍 Steg 4: Testa filtrering och sökning

### 4.1 Testa filter
- Klicka på knapparna: "Alla", "Väntar", "Korrekt", "Felaktig", "Granska"
- Tabellen bör uppdateras och visa endast analyser med vald status

### 4.2 Testa sökning
- Använd sökfältet överst
- Sök på filnamn, postnummer eller period
- Tabellen bör filtreras baserat på söktermen

---

## 👁️ Steg 5: Granska en analys

### 5.1 Öppna detaljvy
- Klicka på "Granska" knappen för en analys i tabellen
- En modal ska öppnas med detaljerad information

### 5.2 Verifiera information
I detaljvyn bör du se:

**Fakturadata:**
- Total belopp
- Förbrukning (kWh)
- Elnät kostnad
- Elhandel kostnad
- Extra avgifter (totalt + detaljerad lista)

**Besparingsberäkning:**
- Nuvarande kostnad
- Potentiell besparing
- Billigaste alternativ
- Besparing i procent

**AI-information:**
- Confidence-nivå (%)
- Varningar (om några)

### 5.3 Testa validering
1. Välj en status från dropdown: "Korrekt", "Felaktig" eller "Behöver granskas"
2. Lägg till anteckningar i textfältet (valfritt)
3. Klicka på "Spara validering"
4. Modal ska stängas och tabellen uppdateras
5. Status i tabellen bör ändras till vald status

---

## 🐛 Felsökning

### Problem: Inga analyser visas i admin
**Lösningar:**
1. Kontrollera att migration är körd:
   ```sql
   -- Kör i Supabase SQL Editor eller Cloudflare D1 Console
   SELECT COUNT(*) FROM bill_analyses;
   ```

2. Kontrollera browser console för fel:
   - Öppna Developer Tools (F12)
   - Gå till Console-fliken
   - Leta efter felmeddelanden

3. Kontrollera Network-fliken:
   - Öppna Developer Tools (F12)
   - Gå till Network-fliken
   - Ladda om sidan
   - Sök efter `/api/bill-analyses`
   - Kontrollera response status och innehåll

### Problem: Analyser sparas inte när fakturor laddas upp
**Lösningar:**
1. Kontrollera att databas-binding finns:
   - I Cloudflare Pages: Settings → Functions → D1 Database bindings
   - Binding ska heta `DB`

2. Kontrollera server logs:
   - I Cloudflare Dashboard: Workers & Pages → Din app → Logs
   - Leta efter felmeddelanden relaterade till `bill_analyses`

3. Verifiera att tabellen finns:
   ```sql
   SELECT name FROM sqlite_master WHERE type='table' AND name='bill_analyses';
   ```

### Problem: API returnerar fel
**Kontrollera:**
- Öppna Network-fliken i browser
- Testa API direkt: `GET /api/bill-analyses`
- Kontrollera response för felmeddelanden

---

## ✅ Checklista för verifiering

- [ ] Kan ladda upp faktura och få analys
- [ ] Ser loggmeddelande om att analys sparas i databasen
- [ ] Kan logga in på `/admin/bill-analyses`
- [ ] Ser statistik-boxar med korrekt antal analyser
- [ ] Ser tabell med fakturaanalyser
- [ ] Kan filtrera på status
- [ ] Kan söka efter analyser
- [ ] Kan öppna detaljvy för en analys
- [ ] Ser all fakturadata i detaljvyn
- [ ] Ser besparingsberäkning i detaljvyn
- [ ] Kan uppdatera valideringsstatus
- [ ] Status uppdateras i tabellen efter validering

---

## 📞 Ytterligare hjälp

Om du fortfarande har problem:
1. Kontrollera browser console för felmeddelanden
2. Kontrollera server logs i Cloudflare Dashboard
3. Verifiera att alla migrations är körda
4. Kontrollera att databas-binding är korrekt konfigurerad


