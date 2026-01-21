# Supabase Auth Setup Checklist för ELbasen

## ✅ Steg 1: Google Cloud Console (KLAR!)

Du har redan lagt till:
- ✅ `https://tptwyuywgchxcjxybmya.supabase.co/auth/v1/callback` i Google Cloud Console

**Detta är korrekt!** ✅

## ⏳ Steg 2: Supabase Dashboard - Google OAuth Provider

Gå till Supabase Dashboard för projektet **ELbasen**:

1. **Authentication** > **Providers** > **Google**
2. Aktivera Google provider (toggle på)
3. Fyll i:
   - **Client ID (for OAuth)**: Samma som du har i Google Cloud Console
   - **Client Secret (for OAuth)**: Samma som du har i Google Cloud Console
4. **VIKTIGT - Lägg till Site URL:**
   - I fältet **Site URL** eller **Redirect URLs**, lägg till:
     - `https://elbespararen.se` (produktion)
     - `http://localhost:3000` (utveckling)
5. Klicka på **Save**

**OBS:** Supabase hanterar OAuth-flödet automatiskt. Du behöver INTE lägga till `/api/auth/callback` här - det hanteras av vår kod.

## ✅ Steg 3: Environment Variables (KLAR!)

Du har redan lagt till:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://tptwyuywgchxcjxybmya.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Din anon key

**Detta är korrekt!** ✅

## Testa nu!

1. Gå till `https://elbespararen.se/auth/signin`
2. Klicka på "Fortsätt med Google"
3. Du bör redirectas till Google för autentisering
4. Efter autentisering bör du redirectas tillbaka till `/dashboard`

## Flödet

1. Användaren klickar "Fortsätt med Google" → `/api/auth/signin/google`
2. Vår kod skapar OAuth URL med `redirectTo: https://elbespararen.se/api/auth/callback`
3. Supabase redirectar till Google med sin callback: `https://tptwyuywgchxcjxybmya.supabase.co/auth/v1/callback`
4. Google autentiserar användaren och redirectar tillbaka till Supabase callback
5. Supabase exchange:ar koden och redirectar till vår callback: `https://elbespararen.se/api/auth/callback`
6. Vår callback exchange:ar koden för session och redirectar till `/dashboard`

## Felsökning

Om du får fel:
- Kontrollera att Google OAuth är aktiverat i Supabase Dashboard
- Kontrollera att Client ID och Client Secret är korrekt ifyllda i Supabase
- Kontrollera Cloudflare Pages logs för felmeddelanden
