# 🔧 Felsökning: Fakturaanalyser syns inte i admin

Om du har laddat upp en faktura men den inte syns i admin-gränssnittet, följ dessa steg:

## ✅ Steg 1: Kontrollera browser console

1. Öppna Developer Tools (F12)
2. Gå till **Console**-fliken
3. Ladda om admin-sidan (`/admin/bill-analyses`)
4. Leta efter felmeddelanden

**Vanliga fel:**
- `bill_analyses table does not exist` → Migration saknas
- `Failed to fetch` → API-problem
- `500 Internal Server Error` → Serverfel

---

## ✅ Steg 2: Kontrollera Network-fliken

1. Öppna Developer Tools (F12)
2. Gå till **Network**-fliken
3. Ladda om admin-sidan
4. Sök efter request till `/api/bill-analyses`
5. Klicka på requesten och kontrollera:
   - **Status**: Bör vara `200 OK`
   - **Response**: Bör innehålla `success: true` och `data: []` (eller array med analyser)

**Om du ser fel:**
- **404**: API-routen finns inte → Kontrollera deployment
- **500**: Serverfel → Kolla server logs
- **CORS error**: Konfigurationsproblem

---

## ✅ Steg 3: Verifiera att tabellen finns

### Om du använder Supabase:
1. Gå till Supabase Dashboard
2. Öppna **SQL Editor**
3. Kör:
```sql
SELECT COUNT(*) FROM bill_analyses;
```

**Om tabellen saknas:**
- Kör migration `0032_create_bill_analyses.sql` i SQL Editor

### Om du använder Cloudflare D1:
1. Gå till Cloudflare Dashboard
2. Öppna **Workers & Pages** → **D1**
3. Välj din databas
4. Öppna **Console**
5. Kör:
```sql
SELECT COUNT(*) FROM bill_analyses;
```

**Om tabellen saknas:**
- Kör migration via Cloudflare CLI eller Dashboard

---

## ✅ Steg 4: Kontrollera att analysen sparas

### När du laddar upp en faktura:

1. Öppna **Console** (F12)
2. Ladda upp en faktura
3. Leta efter dessa loggar:

**✅ Om det fungerar:**
```
[parse-bill-v3] Analys sparad i databasen för admin-granskning
```

**❌ Om det inte fungerar:**
```
[parse-bill-v3] Kunde inte spara analys i databasen: [felmeddelande]
[parse-bill-v3] ⚠️ bill_analyses tabellen saknas! Kör migration...
```

### Kontrollera Network-fliken:

1. Öppna **Network** (F12)
2. Ladda upp faktura
3. Sök efter `/api/parse-bill-v3`
4. Kontrollera response - bör innehålla `success: true`

---

## ✅ Steg 5: Testa API direkt

Öppna browser console och kör:

```javascript
// Testa att hämta analyser
fetch('/api/bill-analyses')
  .then(res => res.json())
  .then(data => {
    console.log('Analyser:', data);
    if (!data.success) {
      console.error('Fel:', data.error, data.details);
    }
  })
  .catch(err => console.error('Fetch error:', err));
```

**Förväntat resultat:**
```javascript
{
  success: true,
  data: [...], // Array med analyser
  count: 0    // Antal analyser
}
```

---

## ✅ Steg 6: Kontrollera databas-binding

### Cloudflare Pages:
1. Gå till Cloudflare Dashboard
2. **Workers & Pages** → Din app
3. **Settings** → **Functions**
4. Scrolla till **D1 Database bindings**
5. Kontrollera att binding finns med namn `DB`

**Om binding saknas:**
- Lägg till binding: Namn `DB`, Database: `elbespararen-db`

### Supabase:
- Kontrollera att `SUPABASE_URL` och `SUPABASE_SERVICE_KEY` är korrekt konfigurerade i miljövariabler

---

## ✅ Steg 7: Kontrollera server logs

### Cloudflare:
1. Gå till Cloudflare Dashboard
2. **Workers & Pages** → Din app
3. **Logs**-fliken
4. Leta efter fel relaterade till `bill_analyses`

### Lokal utveckling:
- Kolla terminal där `npm run dev` körs
- Leta efter felmeddelanden

---

## 🐛 Vanliga problem och lösningar

### Problem 1: "bill_analyses table does not exist"
**Lösning:**
- Kör migration `0032_create_bill_analyses.sql` i din databas

### Problem 2: Analyser sparas inte när fakturor laddas upp
**Möjliga orsaker:**
- Databas-binding saknas eller är felaktig
- Tabellen finns inte
- Fel i SQL-syntax (t.ex. PostgreSQL vs SQLite)

**Lösning:**
1. Kontrollera browser console för felmeddelanden
2. Verifiera att tabellen finns (se Steg 3)
3. Kontrollera databas-binding (se Steg 6)

### Problem 3: Admin-sidan visar inga analyser men de finns i databasen
**Möjliga orsaker:**
- API returnerar fel
- Frontend kan inte hämta data
- CORS-problem

**Lösning:**
1. Testa API direkt (se Steg 5)
2. Kontrollera Network-fliken (se Steg 2)
3. Kontrollera browser console för fel

### Problem 4: Analyser sparas men syns inte i admin
**Möjliga orsaker:**
- Filter är aktivt (t.ex. "Korrekt" när alla är "Väntar")
- Sökfilter är aktivt
- Data hämtas inte korrekt

**Lösning:**
1. Klicka på "Alla" i filter-knapparna
2. Rensa sökfältet
3. Ladda om sidan
4. Kontrollera browser console

---

## 📞 Ytterligare hjälp

Om inget av ovanstående löser problemet:

1. **Kopiera felmeddelanden** från browser console
2. **Kopiera server logs** från Cloudflare Dashboard
3. **Kontrollera databas** direkt med SQL:
   ```sql
   SELECT * FROM bill_analyses ORDER BY created_at DESC LIMIT 5;
   ```

Dela dessa uppgifter för vidare hjälp!

