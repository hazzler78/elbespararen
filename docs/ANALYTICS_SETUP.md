# Analytics Setup Guide

## Varför ser jag inte riktig data?

För närvarande returnerar `/api/analytics` tom data (0-värden) eftersom Google Analytics Data API inte är integrerad ännu.

## Alternativ för att få riktig data

### Alternativ 1: Använd externa dashboards (Enklast)
- **Google Analytics Dashboard**: Klicka på länken i analytics-sektionen
- **Hotjar Dashboard**: Klicka på länken i analytics-sektionen

Detta är det enklaste sättet att se data just nu.

### Alternativ 2: Integrera Google Analytics Data API (Avancerat)

För att hämta data direkt i appen behöver du:

1. **Hämta Property ID**
   - Gå till [Google Analytics](https://analytics.google.com)
   - Välj din property
   - Property ID finns i Admin > Property Settings
   - Format: `123456789` (inte `G-XXXXXXXXXX`)

2. **Skapa Service Account**
   - Gå till [Google Cloud Console](https://console.cloud.google.com)
   - Skapa ett nytt projekt eller välj befintligt
   - Aktivera "Google Analytics Data API"
   - Skapa Service Account
   - Ladda ner JSON-nyckeln

3. **Ge Service Account behörighet**
   - I Google Analytics: Admin > Property Access Management
   - Lägg till Service Account email med "Viewer"-behörighet

4. **Konfigurera miljövariabler**
   ```env
   GOOGLE_ANALYTICS_PROPERTY_ID=123456789
   GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}
   ```

5. **Installera paket** (om vi växlar till Node.js runtime)
   ```bash
   npm install @google-analytics/data
   ```

### Alternativ 3: Använd Measurement Protocol (Enklare men begränsat)

Measurement Protocol kan användas för att skicka data, men inte hämta historisk data.

### Alternativ 4: Använd tredjepartstjänst

- **Plausible Analytics** - Enklare API, GDPR-vänligt
- **Simple Analytics** - Enkelt API
- **Umami** - Open source, egen hosting

## Nuvarande status

- ✅ Analytics-spårning är aktiverat (Google Analytics + Hotjar)
- ✅ Analytics-sektion i admin dashboard
- ✅ Länkar till externa dashboards
- ❌ Direkt API-integration för att hämta data (kräver konfiguration)

## Rekommendation

För nu: Använd länkarna till Google Analytics och Hotjar dashboards för att se data.

För framtiden: Om du vill ha data direkt i appen, implementera Google Analytics Data API eller överväg ett alternativ som Plausible Analytics.

