# Supabase Quick Setup Guide för ELbasen

## Steg 1: Hitta dina Supabase-värden

1. Gå till [Supabase Dashboard](https://app.supabase.com/)
2. Välj projektet **ELbasen**
3. Gå till **Settings** > **API**
4. Du behöver två värden:
   - **Project URL** → Detta är din `NEXT_PUBLIC_SUPABASE_URL`
     - Exempel: `https://abcdefghijklmnop.supabase.co`
   - **anon public** key → Detta är din `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - En lång sträng som börjar med `eyJ...`

## Steg 2: Konfigurera Google OAuth i Supabase

1. I Supabase Dashboard för **ELbasen**, gå till **Authentication** > **Providers**
2. Klicka på **Google**
3. Aktivera Google provider (toggle på)
4. Fyll i:
   - **Client ID (for OAuth)**: Samma som du har i Google Cloud Console
   - **Client Secret (for OAuth)**: Samma som du har i Google Cloud Console
5. Klicka på **Save**

## Steg 3: Uppdatera Google Cloud Console

1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Gå till **APIs & Services** > **Credentials**
3. Välj ditt OAuth 2.0 Client ID
4. I **Authorized redirect URIs**, lägg till:
   - `https://[ditt-projekt-ref].supabase.co/auth/v1/callback`
   - **Hitta projekt-ref:** I Supabase Dashboard > Settings > API > Project URL
     - Om din URL är `https://abcdefghijklmnop.supabase.co`
     - Lägg till: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
5. Klicka på **Save**

## Steg 4: Verifiera Environment Variables

Kontrollera att du har satt följande i **Cloudflare Pages**:

1. Gå till Cloudflare Dashboard > Pages > elbespararen > Settings > Environment Variables
2. Lägg till/verifiera:
   - `NEXT_PUBLIC_SUPABASE_URL` = Din Project URL från Supabase (ex: `https://abcdefghijklmnop.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Din anon public key från Supabase

Och i din lokala `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[ditt-projekt-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...[din anon key]
```

## Steg 5: Testa

1. Gå till `https://elbespararen.se/auth/signin`
2. Klicka på "Fortsätt med Google"
3. Du bör redirectas till Google för autentisering
4. Efter autentisering bör du redirectas tillbaka till `/dashboard`

## Felsökning

### "Invalid redirect URI"
- Kontrollera att redirect URI i Google Cloud Console matchar exakt:
  - `https://[ditt-projekt-ref].supabase.co/auth/v1/callback`
- Kontrollera att redirect URI i Supabase matchar:
  - `https://elbespararen.se/api/auth/callback` (produktion)
  - `http://localhost:3000/api/auth/callback` (utveckling)

### "Missing Supabase environment variables"
- Kontrollera att `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY` är korrekt satta i Cloudflare Pages
- Kontrollera att de är satta för **Production** environment

### "Configuration error"
- Kontrollera att Google OAuth är aktiverat i Supabase Dashboard
- Kontrollera att Client ID och Client Secret är korrekt ifyllda i Supabase
