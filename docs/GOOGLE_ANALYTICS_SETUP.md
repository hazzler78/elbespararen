# Google Analytics Data API Setup

## Steg 1: Hämta Property ID

1. Gå till [Google Analytics](https://analytics.google.com)
2. Välj din property
3. Gå till **Admin** (kugghjulsikonen) > **Property Settings**
4. Kopiera **Property ID** (format: `123456789`, inte Measurement ID som `G-XXXXXXXXXX`)
5. Lägg till i `.env`:
   ```env
   GOOGLE_ANALYTICS_PROPERTY_ID=123456789
   ```

## Steg 2: Skapa Service Account (Rekommenderat)

### 2.1 Skapa Service Account i Google Cloud

1. Gå till [Google Cloud Console](https://console.cloud.google.com)
2. Välj eller skapa ett projekt
3. Gå till **IAM & Admin** > **Service Accounts**
4. Klicka på **Create Service Account**
5. Fyll i namn och beskrivning
6. Klicka **Create and Continue**
7. Ge rollen **Viewer** (eller **Analytics Viewer** om tillgängligt)
8. Klicka **Done**

### 2.2 Skapa och ladda ner nyckel

1. Klicka på den skapade service account
2. Gå till fliken **Keys**
3. Klicka **Add Key** > **Create new key**
4. Välj **JSON**
5. Ladda ner JSON-filen

### 2.3 Ge Service Account behörighet i Google Analytics

1. Gå tillbaka till [Google Analytics](https://analytics.google.com)
2. Gå till **Admin** > **Property Access Management**
3. Klicka **+** > **Add users**
4. Lägg till service account email (från JSON-filen, fältet `client_email`)
5. Ge rollen **Viewer**
6. Klicka **Add**

### 2.4 Aktivera Google Analytics Data API

1. Gå till [Google Cloud Console](https://console.cloud.google.com)
2. Välj ditt projekt
3. Gå till **APIs & Services** > **Library**
4. Sök efter "Google Analytics Data API"
5. Klicka på den och aktivera den

### 2.5 Konfigurera miljövariabel

Du har två alternativ:

**Alternativ A: Service Account JSON (Rekommenderat för produktion)**
```env
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**Alternativ B: Access Token (Enklare för utveckling)**
Se nedan för hur du får access token.

## Steg 3: Hämta Access Token (Alternativ B)

Om du vill använda direkt access token istället för service account:

### Medg OAuth 2.0 Playground

1. Gå till [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. I vänster meny, scrolla till **Analytics Reporting API v4** eller **Google Analytics Data API**
3. Markera scope: `https://www.googleapis.com/auth/analytics.readonly`
4. Klicka **Authorize APIs**
5. Logga in med ditt Google-konto
6. Klicka **Exchange authorization code for tokens**
7. Kopiera **Access token**
8. Lägg till i `.env`:
   ```env
   GOOGLE_ANALYTICS_ACCESS_TOKEN=ya29.a0AfH6SMBx...
   ```

**OBS:** Access tokens går ut efter 1 timme. För produktion, använd service account.

## Steg 4: Aktivera Analytics

Lägg till i din `.env`:
```env
NEXT_PUBLIC_ENABLE_ANALYTICS=true
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
GOOGLE_ANALYTICS_ACCESS_TOKEN=your_token_here
# ELLER
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}
```

## Felsökning

### "Property ID saknas"
- Kontrollera att `GOOGLE_ANALYTICS_PROPERTY_ID` är satt korrekt
- Använd Property ID (siffror), inte Measurement ID (G-XXXXXXXXXX)

### "Access Token saknas"
- Kontrollera att antingen `GOOGLE_ANALYTICS_ACCESS_TOKEN` eller `GOOGLE_APPLICATION_CREDENTIALS` är satt
- För service account, kontrollera att JSON är korrekt formaterad

### "Permission denied"
- Kontrollera att service account har "Viewer"-behörighet i Google Analytics
- Kontrollera att Google Analytics Data API är aktiverat i Google Cloud Console

### "Invalid token"
- Access tokens går ut efter 1 timme
- För produktion, använd service account istället

## Ytterligare resurser

- [Google Analytics Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Service Account Setup Guide](https://cloud.google.com/iam/docs/service-accounts)

