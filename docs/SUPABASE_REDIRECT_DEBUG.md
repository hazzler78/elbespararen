# Debug: Supabase OAuth Redirect till Root-sidan

## Problem
När du loggar in med Google hamnar du på `http://localhost:3000/?code=...` istället för `http://localhost:3000/api/auth/callback?code=...`

## Orsak
Supabase validerar `redirectTo`-parametern mot Site URL och Redirect URLs. Om URL:en inte matchar exakt, ignorerar Supabase den och använder Site URL istället (vilket blir `/`).

## Lösning: Verifiera Supabase URL Configuration

### Steg 1: Öppna Supabase Dashboard

1. Gå till [Supabase Dashboard](https://app.supabase.com/)
2. Välj ditt projekt (ELbasen)
3. Klicka på **Authentication** i vänstermenyn
4. Klicka på **URL Configuration** (eller **Configuration** > **URL Configuration**)

### Steg 2: Kontrollera Site URL

**Site URL ska vara:**
```
http://localhost:3000
```

**VIKTIGT:**
- ✅ Lägg INTE till `/api/auth/callback` här
- ✅ Lägg INTE till `/` i slutet
- ✅ Använd `http://` för localhost (inte `https://`)

### Steg 3: Kontrollera Redirect URLs

**Redirect URLs ska innehålla:**
```
http://localhost:3000/api/auth/callback
https://elbespararen.se/api/auth/callback
```

**VIKTIGT:**
- ✅ Lägg till den FULLA URL:en inklusive `/api/auth/callback`
- ✅ Varje URL ska vara på en egen rad eller separerad med komma
- ✅ Kontrollera att det inte finns extra mellanslag eller `/` i slutet
- ✅ För localhost: använd `http://` (inte `https://`)
- ✅ För produktion: använd `https://` (inte `http://`)

### Steg 4: Spara och vänta

1. Klicka på **Save changes** eller **Update**
2. Vänta 1-2 minuter för att Supabase ska uppdatera inställningarna

### Steg 5: Verifiera Google Cloud Console

1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Välj ditt projekt
3. Gå till **APIs & Services** > **Credentials**
4. Klicka på din OAuth 2.0 Client ID
5. Kontrollera **Authorized redirect URIs**

**Authorized redirect URIs ska innehålla:**
```
https://tptwyuywgchxcjxybmya.supabase.co/auth/v1/callback
```

**VIKTIGT:**
- ✅ Detta är Supabase's callback URL (INTE din app's callback URL)
- ✅ Detta ska vara den ENDA redirect URI för Google OAuth
- ✅ Google redirectar till Supabase, sedan redirectar Supabase till din app

## Flödet ska vara:

1. Användaren klickar "Fortsätt med Google" → `/api/auth/signin/google`
2. Vår kod anropar `signInWithOAuth` med `redirectTo: http://localhost:3000/api/auth/callback`
3. Supabase validerar `redirectTo` mot Redirect URLs ✅
4. Supabase redirectar till Google med sin callback: `https://tptwyuywgchxcjxybmya.supabase.co/auth/v1/callback`
5. Google autentiserar användaren och redirectar tillbaka till Supabase callback
6. Supabase exchange:ar koden och redirectar till vår callback: `http://localhost:3000/api/auth/callback` ✅
7. Vår callback exchange:ar koden för session och redirectar till `/dashboard`

## Felsökning

### Problem: Jag hamnar fortfarande på `/` istället för `/api/auth/callback`

**Kontrollera:**
1. ✅ Site URL är exakt `http://localhost:3000` (inga extra `/` eller sökvägar)
2. ✅ Redirect URLs innehåller exakt `http://localhost:3000/api/auth/callback`
3. ✅ Inga extra mellanslag eller `/` i slutet av URL:erna
4. ✅ Du har väntat 1-2 minuter efter att ha sparat ändringarna
5. ✅ Du har rensat cookies och testat igen

### Problem: Jag hittar inte "Redirect URLs"-fältet

**Alternativa namn:**
- "Additional Redirect URLs"
- "Allowed Redirect URLs"
- "Redirect URL Whitelist"
- Kan finnas under "Advanced Settings"

**Om du fortfarande inte hittar det:**
- Kontrollera att du är på rätt sida: **Authentication** > **URL Configuration**
- Om du inte ser det, kan det vara att din Supabase-version har ett annat gränssnitt

### Problem: Google visar fel app-namn

Detta är ett separat problem. Se `docs/GOOGLE_OAUTH_APPLICATION_NAME.md` för instruktioner.

## Testa efter ändringar

1. Rensa cookies i din webbläsare för `localhost:3000`
2. Gå till `http://localhost:3000/auth/signin`
3. Klicka på "Fortsätt med Google"
4. Efter Google-autentisering bör du redirectas till `/api/auth/callback` (inte `/`)
5. Efter callback bör du redirectas till `/dashboard` med en fungerande session

## Ytterligare debugging

Om problemet kvarstår efter att du har kontrollerat allt ovan:

1. Öppna Browser DevTools > Network
2. Filtrera på "auth" eller "callback"
3. Klicka på "Fortsätt med Google"
4. Kontrollera vilken URL Google redirectar till
5. Kontrollera vilken URL Supabase redirectar till
6. Dela dessa URL:er så kan vi debugga vidare
