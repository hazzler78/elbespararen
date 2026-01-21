# Supabase Google OAuth Setup Guide

## Steg 1: Konfigurera Google OAuth i Supabase

1. **Gå till Supabase Dashboard**
   - Öppna [Supabase Dashboard](https://app.supabase.com/)
   - Välj ditt projekt **ELbasen**

2. **Aktivera Google Provider**
   - Gå till **Authentication** > **Providers**
   - Hitta **Google** i listan
   - Klicka på **Google** för att öppna inställningar

3. **Konfigurera Google OAuth**
   - **Enable Google provider**: Aktivera (toggle på)
   - **Client ID (for OAuth)**: Använd samma Client ID som du har för NextAuth
     - Hittar du i [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - **Client Secret (for OAuth)**: Använd samma Client Secret som du har för NextAuth
     - Hittar du i [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

4. **Lägg till Redirect URLs i Supabase**
   - I Supabase Google provider-inställningar, lägg till:
     - `https://elbespararen.se/api/auth/callback` (produktion)
     - `http://localhost:3000/api/auth/callback` (utveckling)

5. **Spara inställningar**
   - Klicka på **Save**

## Steg 2: Uppdatera Google Cloud Console Redirect URIs

Du behöver också uppdatera Google Cloud Console för att tillåta Supabase redirects:

1. **Gå till Google Cloud Console**
   - Öppna [Google Cloud Console](https://console.cloud.google.com/)
   - Gå till **APIs & Services** > **Credentials**
   - Välj ditt OAuth 2.0 Client ID

2. **Lägg till Authorized redirect URIs**
   - I **Authorized redirect URIs**, lägg till:
     - `https://[your-project-ref].supabase.co/auth/v1/callback`
     - Hittar du din project ref i Supabase Dashboard > Settings > API > Project URL
     - Exempel: Om din Project URL är `https://abcdefghijklmnop.supabase.co`, lägg till:
       - `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

3. **Spara ändringar**
   - Klicka på **Save**

## Steg 3: Verifiera Environment Variables

Kontrollera att du har satt följande i Cloudflare Pages:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Och i din lokala `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Steg 4: Testa Google OAuth

1. **Starta utvecklingsservern**
   ```bash
   npm run dev
   ```

2. **Testa inloggning**
   - Gå till `http://localhost:3000/auth/signin`
   - Klicka på "Fortsätt med Google"
   - Du bör redirectas till Google för autentisering
   - Efter autentisering bör du redirectas tillbaka till `/dashboard`

3. **Kontrollera session**
   - Efter inloggning bör du se din användarinformation i dashboard
   - Kontrollera att cookies är satta korrekt

## Felsökning

### Problem: "Invalid redirect URI"
- Kontrollera att redirect URI i Google Cloud Console matchar exakt:
  - `https://[your-project-ref].supabase.co/auth/v1/callback`
- Kontrollera att redirect URI i Supabase matchar:
  - `https://elbespararen.se/api/auth/callback` (produktion)
  - `http://localhost:3000/api/auth/callback` (utveckling)

### Problem: "Configuration error"
- Kontrollera att `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY` är korrekt satta
- Kontrollera att Google OAuth är aktiverat i Supabase Dashboard

### Problem: "User not found"
- Detta är normalt första gången - Supabase skapar automatiskt användaren
- Kontrollera i Supabase Dashboard > Authentication > Users att användaren skapades

## Nästa steg

När Google OAuth fungerar:
1. ✅ Testa sign out-funktionalitet
2. ✅ Uppdatera återstående sidor som använder NextAuth (se `SUPABASE_AUTH_MIGRATION.md`)
3. ✅ Ta bort `next-auth` paketet när allt fungerar
