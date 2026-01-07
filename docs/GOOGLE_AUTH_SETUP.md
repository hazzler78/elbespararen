# Google OAuth Setup Guide

Denna guide visar hur du konfigurerar Google OAuth för användarautentisering i Elbespararen.

## Steg 1: Skapa Google OAuth Credentials

1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Välj eller skapa ett projekt
3. Gå till **APIs & Services** > **Credentials**
4. Klicka på **Create Credentials** > **OAuth client ID**
5. **VIKTIGT - Konfigurera OAuth consent screen först:**
   - Gå till **OAuth consent screen**
   - Välj **External** (eller Internal om du har Google Workspace)
   - Fyll i app-informationen:
     - App name: Elbespararen
     - User support email: din email
     - Developer contact information: din email
   - Lägg till scopes: `email`, `profile`, `openid`
   - **För produktion:** Du måste antingen:
     - **Lägga till test users** (om appen är i "Testing" läge)
     - **Eller skicka in för verifiering** (för att göra appen tillgänglig för alla)
   - **Om du får "403: disallowed_useragent":**
     - Gå tillbaka till OAuth consent screen
     - Lägg till din email i "Test users" om appen är i Testing-läge
     - Eller skicka in appen för verifiering till Google

6. Skapa OAuth Client ID:
   - Application type: **Web application**
   - Name: Elbespararen (eller ditt val)
   
   **VIKTIGT - Skillnad mellan de två fälten:**
   
   - **Authorized JavaScript origins** (INGEN path, bara domän):
     - `http://localhost:3000` (för utveckling)
     - `https://elbespararen.se` (för produktion - INTE med /api/auth/callback/google!)
   
   - **Authorized redirect URIs** (MED full path):
     - `http://localhost:3000/api/auth/callback/google` (för utveckling)
     - `https://elbespararen.se/api/auth/callback/google` (för produktion)
   
   **Vanligt fel:** Lägg INTE callback-URL:en i "JavaScript origins" - det fältet ska bara ha domänen!

7. Kopiera **Client ID** och **Client Secret**

## Steg 2: Konfigurera Environment Variables

Lägg till följande i din `.env.local` fil:

```env
# Google OAuth
GOOGLE_CLIENT_ID=din_client_id_här
GOOGLE_CLIENT_SECRET=din_client_secret_här

# NextAuth
NEXTAUTH_SECRET=generera_en_säker_nyckel_här
NEXTAUTH_URL=http://localhost:3000
```

### Generera NEXTAUTH_SECRET

```bash
# På Mac/Linux:
openssl rand -base64 32

# På Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Steg 3: Kör Migrations

Kör migrations för att skapa users-tabellen och lägga till user_id i bill_analyses:

```bash
# Lokalt (om du använder wrangler):
wrangler d1 migrations apply elbespararen-db

# I produktion:
wrangler d1 migrations apply elbespararen-db --remote
```

## Steg 4: Testa

1. Starta utvecklingsservern:
   ```bash
   npm run dev
   ```

2. Gå till `/auth/signin` eller `/dashboard`
3. Klicka på "Logga in med Google"
4. Välj ditt Google-konto
5. Du bör nu vara inloggad och kunna se ditt dashboard

## Produktion

För produktion, se till att:

1. **Uppdatera Google OAuth Credentials:**
   - Lägg till din produktionsdomän i Authorized JavaScript origins
   - Lägg till produktions-URL i Authorized redirect URIs

2. **Sätt environment variables i Cloudflare Pages:**
   - Gå till Cloudflare Dashboard > Pages > Your Project > Settings > Environment Variables
   - Lägg till:
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (din produktions-URL)

3. **Kör migrations i produktion:**
   ```bash
   wrangler d1 migrations apply elbespararen-db --remote
   ```

## Felsökning

### "redirect_uri_mismatch"
- Kontrollera att redirect URI i Google Console matchar exakt din URL
- Se till att både `http://` och `https://` är korrekt konfigurerade

### "invalid_client"
- Kontrollera att GOOGLE_CLIENT_ID och GOOGLE_CLIENT_SECRET är korrekt satta
- Se till att OAuth consent screen är konfigurerad

### Session fungerar inte
- Kontrollera att NEXTAUTH_SECRET är satt
- Kontrollera att NEXTAUTH_URL matchar din faktiska URL

### User skapas inte i databasen
- Kontrollera att migrations har körts
- Kontrollera databas-loggarna för fel

## Ytterligare Information

- [NextAuth.js Dokumentation](https://next-auth.js.org/)
- [Google OAuth Dokumentation](https://developers.google.com/identity/protocols/oauth2)
