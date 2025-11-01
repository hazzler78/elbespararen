# Databasinformation för Elbespararen

## Vilken databas används?

Applikationen använder **två olika databaser** beroende på miljön:

### 1. **Lokal utveckling** (`NODE_ENV=development`)
- **MockDatabase** - En in-memory databas i TypeScript
- Används när ingen Cloudflare D1-binding finns
- Data försvinner när servern startar om
- För utveckling och testning

### 2. **Produktion** (Cloudflare Pages)
- **Cloudflare D1 Database** - En SQLite-baserad databas i Cloudflare
- Databasnamn: `elbespararen-db`
- Database ID: `a475e6e6-5228-4598-8751-634e7de05ec0`
- Konfigurerad i `wrangler.toml`
- Data sparas permanent i Cloudflare

## SwitchProcess.tsx använder...

`SwitchProcess.tsx` och API-rutten `/api/switch-requests` använder automatisk databasdetektering:

```typescript
// I switch-requests/route.ts
const db = createDatabaseFromBinding(env?.DB);
```

- Om D1-binding finns → **CloudflareDatabase** (produktion)
- Om ingen binding finns → **MockDatabase** (lokalt)

## Ta bort testkunder

### Metod 1: Via Admin-panelen (Rekommenderat)

1. Gå till `/admin/switch-requests`
2. Välj de bytförfrågningar du vill ta bort (checkbox)
3. Klicka på "Ta bort valda" för att ta bort flera, eller
4. Klicka på "Ta bort" knappen under varje enskild förfrågan
5. Bekräfta borttagningen

### Metod 2: Via API

**Ta bort en enskild förfrågan:**
```bash
DELETE /api/switch-requests?id=<switch-request-id>
```

**Exempel:**
```powershell
Invoke-RestMethod -Uri "https://elbespararen.pages.dev/api/switch-requests?id=switch-1234567890" -Method DELETE
```

### Metod 3: Direkt via Cloudflare Console (SQL)

1. Gå till [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Välj **Workers & Pages** → **D1 SQL Database**
3. Välj databasen: **elbespararen-db**
4. Öppna **Console**
5. Kör SQL-kommando:

```sql
-- Ta bort alla testkunder (exempel - anpassa efter dina behov)
DELETE FROM switch_requests 
WHERE customer_info LIKE '%test%' 
   OR customer_info LIKE '%hazzler%'
   OR customer_info LIKE '%example%'
   OR email LIKE '%test%';

-- Eller ta bort specifika IDs
DELETE FROM switch_requests WHERE id IN ('switch-123', 'switch-456');

-- Eller ta bort alla före ett visst datum
DELETE FROM switch_requests WHERE created_at < '2024-01-01';

-- Se alla förfrågningar först (för att vara säker)
SELECT id, customer_info, created_at FROM switch_requests ORDER BY created_at DESC;
```

## Viktigt!

⚠️ **Borttagning kan inte ångras!** 

- Alla bytförfrågningar tas bort permanent
- Kopplade e-postmeddelanden i MailerLite påverkas inte
- Kontrollera noggrant innan du tar bort

## Identifiera testkunder

För att hitta testkunder i databasen kan du filtrera på:

1. **E-postadress** som innehåller "test", "example", eller ditt testkonto
2. **Skapelsedatum** - testdata är ofta nyare
3. **Status** - testkunder kan ha status "pending"
4. **Anteckningar** - lägg märke på "TEST" i anteckningar

**Exempel SQL för att hitta testkunder:**
```sql
SELECT 
  id,
  customer_info,
  status,
  created_at,
  notes
FROM switch_requests
WHERE customer_info LIKE '%test%'
   OR customer_info LIKE '%example%'
   OR customer_info LIKE '%hazzler%'
   OR notes LIKE '%TEST%'
   OR notes LIKE '%test%'
ORDER BY created_at DESC;
```

## Databasschemat

Switch requests lagras i tabellen `switch_requests` med följande struktur:

- `id` - Unik ID för bytförfrågan
- `customer_info` - JSON med kundinformation (förnamn, efternamn, email, telefon, etc.)
- `address` - JSON med adressinformation
- `current_provider` - JSON med nuvarande leverantör
- `new_provider` - JSON med ny leverantör
- `bill_data` - JSON med elräkningsdata
- `savings` - JSON med besparingsberäkningar
- `status` - Status (pending, processing, completed, cancelled)
- `notes` - Anteckningar
- `created_at` - Skapelsedatum
- `updated_at` - Uppdateringsdatum

