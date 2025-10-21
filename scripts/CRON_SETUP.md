# 🕐 Cloudflare Cron Jobs Setup

## Översikt
Detta system uppdaterar automatiskt fastpriser från externa leverantörer varje natt kl 00:05.

## Komponenter

### 1. API Endpoints
- **`/api/prices/update`** - Huvudfunktionen som hämtar och uppdaterar priser
- **`/api/cron/prices`** - Cron job handler för automatisk körning

### 2. Leverantörer som uppdateras
- Cheap Energy (`cheapenergy_v2`)
- Energi2 (`energi2_v2`) 
- Stockholms El (`sthlmsel_v2`)
- Svealands EL (`svealandsel_v2`)
- Svekraft (`svekraft_v2`)
- Motala El (`motala_v2`)

## Setup i Cloudflare

### Steg 1: Konfigurera wrangler.toml
```toml
[[triggers]]
crons = ["5 0 * * *"]  # 00:05 varje dag
```

### Steg 2: Sätta miljövariabler
```bash
# I Cloudflare Dashboard -> Pages -> Settings -> Environment Variables
CRON_SECRET=your-secure-secret-key
```

### Steg 3: Aktivera Cron Jobs
1. Gå till Cloudflare Dashboard
2. Välj ditt Pages projekt
3. Gå till "Functions" tab
4. Aktivera "Cron Triggers"
5. Lägg till cron schedule: `5 0 * * *`

## Testning

### Manuell testning
1. Gå till `/admin/price-updates`
2. Klicka "Uppdatera priser nu"
3. Se resultat i realtid

### Testa Cron endpoint direkt
```bash
curl -X GET "https://elbespararen.pages.dev/api/cron/prices" \
  -H "Authorization: Bearer your-secure-secret-key"
```

## Loggar och övervakning

### Loggar finns i:
- Cloudflare Dashboard -> Pages -> Functions -> Logs
- Browser console (för manuella tester)

### Sök efter:
- `[Price Update]` - Huvudprocess
- `[Cron]` - Cron job execution
- `[Admin]` - Manuella tester

## Felsökning

### Vanliga problem:
1. **Timeout** - Externa API:er svarar inte
2. **Parsing fel** - Leverantörens data format ändrat
3. **Database fel** - D1 binding problem

### Lösningar:
1. Kontrollera externa URL:er fungerar
2. Uppdatera parser funktioner
3. Verifiera D1 database binding

## Säkerhet

### Cron job autentisering:
- Använder `CRON_SECRET` för autentisering
- Endast legitima cron requests accepteras

### Rate limiting:
- 60 sekunder timeout per request
- Graceful error handling för alla leverantörer

## Utveckling

### Lägg till ny leverantör:
1. Lägg till i `PRICE_ENDPOINTS` array
2. Skapa parser funktion
3. Testa manuellt
4. Deploy och övervaka

### Ändra uppdateringsfrekvens:
```toml
# I wrangler.toml
crons = ["5 0 * * *"]  # Dagligen 00:05
crons = ["5 */6 * * *"] # Var 6:e timme
crons = ["5 0 * * 1"]   # Måndagar 00:05
```
