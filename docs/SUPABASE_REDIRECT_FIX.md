# Fixa Supabase OAuth Redirect Problem

## Problem
När du loggar in med Google via Supabase, redirectar den till `http://localhost:3000/?code=...` istället för `http://localhost:3000/api/auth/callback?code=...`

## Orsak
Supabase ignorerar `redirectTo`-parametern om URL:en inte matchar Site URL eller Redirect URLs i Supabase Dashboard.

## Lösning: Konfigurera Supabase URL Settings

### Steg 1: Gå till Supabase Dashboard

1. Öppna [Supabase Dashboard](https://app.supabase.com/)
2. Välj ditt projekt (ELbasen)

### Steg 2: Konfigurera Authentication URL Settings

1. **Gå till Authentication Settings**
   - Klicka på **Authentication** i vänstermenyn
   - Klicka på **URL Configuration** (eller **Settings** > **URL Configuration**)

2. **Konfigurera Site URL**
   - **Site URL**: `http://localhost:3000` (för utveckling)
   - **VIKTIGT:** Lägg INTE till `/api/auth/callback` här - bara domänen!
   - Detta är den "base URL" som Supabase använder

3. **Konfigurera Redirect URLs**
   - I fältet **Redirect URLs** (eller **Additional Redirect URLs**), lägg till:
   - `http://localhost:3000/api/auth/callback` (för utveckling)
   - `https://elbespararen.se/api/auth/callback` (för produktion)
   - **VIKTIGT:** Här ska du lägga till den FULLA URL:en inklusive `/api/auth/callback`

4. **Spara ändringar**
   - Klicka på **Save** eller **Update**

### Steg 3: Verifiera Google Provider Settings

1. **Gå till Google Provider Settings**
   - **Authentication** > **Providers** > **Google**

2. **Kontrollera att Google är aktiverat**
   - Toggle för **Enable Google provider** ska vara PÅ

3. **Verifiera Client ID och Secret**
   - Kontrollera att **Client ID** och **Client Secret** är korrekt ifyllda

4. **Spara om du gjorde ändringar**

## Varför detta händer

Supabase validerar `redirectTo`-parametern mot:
1. **Site URL** - måste matcha domänen
2. **Redirect URLs** - måste matcha exakt URL:en

Om `redirectTo` inte matchar någon av dessa, ignorerar Supabase den och använder Site URL istället (vilket blir `/`).

## Testa efter ändringar

1. Vänta 1-2 minuter efter att du sparat ändringarna
2. Gå till `http://localhost:3000/auth/signin`
3. Klicka på "Fortsätt med Google"
4. Efter Google-autentisering bör du redirectas till `/api/auth/callback` istället för `/`

## Felsökning

**Jag hittar inte "Redirect URLs"-fältet:**
- I nyare versioner av Supabase kan det heta "Additional Redirect URLs"
- Eller det kan finnas under "Advanced Settings"
- Om du inte hittar det, kontrollera att Site URL är korrekt satt först

**Redirect fungerar fortfarande inte:**
- Kontrollera att URL:en är EXAKT samma som i koden (inklusive `http://` vs `https://`)
- Kontrollera att det inte finns extra `/` i slutet
- Rensa cookies och testa igen
- Vänta några minuter - Supabase kan ta tid att uppdatera inställningar

**Jag får fortfarande `/` istället för `/api/auth/callback`:**
- Kontrollera att både Site URL och Redirect URLs är korrekt konfigurerade
- Kontrollera att du använder rätt miljö (localhost för utveckling, elbespararen.se för produktion)
