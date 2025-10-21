# 🕐 Cloudflare Pages Cron Jobs Setup

## Viktigt! 
Cloudflare Pages stöder INTE `triggers` i wrangler.toml. Vi måste använda Cloudflare Dashboard för att sätta upp Cron Jobs.

## Setup via Cloudflare Dashboard

### Steg 1: Gå till Pages Settings
1. Logga in på [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Välj ditt Pages projekt "elbespararen"
3. Gå till **Settings** → **Functions**

### Steg 2: Aktivera Cron Triggers
1. Scrolla ner till **Cron Triggers**
2. Klicka **"Set up Cron Triggers"**
3. Lägg till ny cron trigger:
   - **Cron expression:** `5 0 * * *` (00:05 varje dag)
   - **Function route:** `/api/cron/prices`

### Steg 3: Sätta miljövariabler
1. Gå till **Settings** → **Environment Variables**
2. Lägg till:
   - **Variable name:** `CRON_SECRET`
   - **Value:** `your-secure-secret-key` (välj ett säkert lösenord)

### Steg 4: Verifiera att det fungerar
1. Gå till **Functions** → **Logs**
2. Vänta till nästa dag kl 00:05 eller testa manuellt
3. Kolla logs för `[Cron]` meddelanden

## Alternativ: Använda extern cron service

Om Cloudflare Pages inte stöder cron jobs kan vi använda en extern service:

### GitHub Actions (Rekommenderat)
```yaml
# .github/workflows/price-update.yml
name: Price Update
on:
  schedule:
    - cron: '5 0 * * *'  # 00:05 UTC varje dag
  workflow_dispatch:  # Manuell körning

jobs:
  update-prices:
    runs-on: ubuntu-latest
    steps:
      - name: Update prices
        run: |
          curl -X POST "https://elbespararen.pages.dev/api/prices/update" \
            -H "Content-Type: application/json"
```

### Uptime Robot eller liknande
- Skapa en monitor som pingar `/api/prices/update` varje dag kl 00:05
- Använd HTTP POST request

## Testning

### Manuell test via admin
1. Gå till `/admin/price-updates`
2. Klicka "Uppdatera priser nu"
3. Se resultat i realtid

### Testa cron endpoint direkt
```bash
curl -X GET "https://elbespararen.pages.dev/api/cron/prices" \
  -H "Authorization: Bearer your-secure-secret-key"
```

## Felsökning

### Om cron jobs inte fungerar på Pages:
1. **Kontrollera Functions logs** i Cloudflare Dashboard
2. **Använd GitHub Actions** som alternativ
3. **Använd extern cron service** som backup

### Vanliga problem:
- **Cron expression fel:** Använd `5 0 * * *` för daglig 00:05
- **Miljövariabler:** Kontrollera att `CRON_SECRET` är satt
- **Function route:** Måste vara `/api/cron/prices`

## Säkerhet

### CRON_SECRET:
- Använd ett starkt lösenord (minst 32 tecken)
- Ändra från default värdet
- Håll det hemligt

### Rate limiting:
- Externa API:er har sina egna rate limits
- Vi hanterar fel gracefully för varje leverantör
- Timeout på 60 sekunder per request

## Övervakning

### Loggar att söka efter:
- `[Price Update]` - Huvudprocess
- `[Cron]` - Cron job execution  
- `[Admin]` - Manuella tester

### Viktiga metrics:
- Antal leverantörer som uppdaterats
- Antal fel per leverantör
- Total tid för uppdatering
