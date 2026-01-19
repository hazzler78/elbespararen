# 🧪 Testa Premium-funktioner

## Snabb guide för att testa premium-upplevelsen

### Steg 1: Sätt en användare till Premium

Använd admin-endpointet för att sätta din användare till premium:

```bash
# Via curl eller Postman
POST /api/admin/set-premium
Content-Type: application/json

{
  "email": "din-email@example.com",
  "tier": "premium"
}
```

Eller via browser console när du är inloggad:

```javascript
fetch('/api/admin/set-premium', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tier: 'premium' })
})
.then(r => r.json())
.then(console.log);
```

### Steg 2: Ladda om dashboard

Efter att du har satt premium-status:
1. Ladda om `/dashboard`-sidan
2. Du bör nu se:
   - **Premium-badge** bredvid "Mitt Dashboard"
   - **"All tid"** alternativ i tidsperiod-väljaren är aktiverat
   - **Export-knappar** är aktiva (CSV, Excel, PDF)
   - **Benchmark-kortet** har premium-styling med sparkles-ikon
   - **Premium-indikatorer** på premium-funktioner

### Steg 3: Testa Premium-funktioner

#### Export-funktioner
1. Klicka på export-knapparna i "Nästa steg"-sektionen
2. Testa CSV-export: `/api/user/export?format=csv&range=all`
3. Testa Excel-export: `/api/user/export?format=excel&range=all`
4. Testa PDF-export: `/api/user/export?format=pdf&range=all` (kommer snart)

#### Obegränsad historik
1. Välj "All tid" i tidsperiod-väljaren
2. Du bör se alla dina fakturaanalyser, inte bara senaste 3 månaderna

### Steg 4: Jämför Free vs Premium

För att se skillnaden:
1. Sätt tillbaka till free: `{ "tier": "free" }`
2. Ladda om dashboard
3. Observera skillnaderna:
   - Premium-badge försvinner
   - "All tid" är disabled
   - Export-knappar visar "Uppgradera till Premium"-länk
   - Benchmark-kortet har lås-ikon och uppgraderingslänk

---

## Premium-visuella element

### Premium-badge
- Visas bredvid "Mitt Dashboard"-titeln
- Guld/gul gradient med Crown-ikon
- Text: "Premium"

### Premium-styling på funktioner
- **Export-kortet**: Grön gradient bakgrund när premium
- **Benchmark-kortet**: Orange gradient bakgrund när premium
- **Sparkles-ikoner**: Visas på premium-funktioner

### Premium-indikatorer
- Små "Premium"-badges på premium-funktioner
- Lås-ikoner på låsta funktioner för free-användare
- Uppgraderingslänkar på låsta funktioner

---

## Återställ till Free

För att återställa till free-användare:

```javascript
fetch('/api/admin/set-premium', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tier: 'free' })
})
.then(r => r.json())
.then(console.log);
```
