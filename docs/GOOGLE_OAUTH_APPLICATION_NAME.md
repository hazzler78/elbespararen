# Ändra Google OAuth Application Name till "Elbespararen"

## Problem
När du loggar in med Google visas Supabase-projektets URL (`tptwyuywgchxcjxybmya.supabase.co`) istället för "Elbespararen" i Google OAuth-dialogen.

**OBS:** Detta är faktiskt normalt - Google visar den domain som används för OAuth redirect. Men vi kan ändå ändra app-namnet så det står "Elbespararen" i dialogen.

## Lösning: Uppdatera OAuth Consent Screen i Google Cloud Console

### Steg 1: Hitta OAuth Consent Screen (INTE Google Auth Platform!)

**VIKTIGT:** Du är förmodligen i "Google Auth Platform" nu - det är FEL ställe!

1. **Gå till Google Cloud Console**
   - Öppna [Google Cloud Console](https://console.cloud.google.com/)
   - Välj ditt projekt "Elbespararen"

2. **Navigera till OAuth Consent Screen**
   - I vänstermenyn, leta efter **"APIs & Services"** (detta är en huvudmeny, INTE "Google Auth Platform")
   - Om du inte ser "APIs & Services" i menyn, klicka på hamburger-menyn (tre streck) längst upp till vänster
   - Under **"APIs & Services"**, klicka på **"OAuth consent screen"**
   - **VIKTIGT:** 
     - ❌ INTE "Google Auth Platform" > "Overview"
     - ❌ INTE "Google Auth Platform" > "Branding"
     - ✅ **"APIs & Services"** > **"OAuth consent screen"**

3. **Alternativ väg om du inte hittar det:**
   - I sökfältet högst upp, sök på: `OAuth consent screen`
   - Eller gå direkt till: [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)

### Steg 2: Redigera App Information

**Direktlänk:** [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)

När du kommer till OAuth consent screen-sidan:

**Om du redan har konfigurerat OAuth Consent Screen:**
1. Du kommer se en översiktssida med app-information
2. **Leta efter en blå knapp som heter "EDIT APP"** (vanligtvis högst upp till höger)
3. Om du inte ser "EDIT APP", leta efter en knapp som heter "PUBLISH APP" eller "CONFIGURE CONSENT SCREEN"
4. Klicka på den för att komma till redigeringsläge
5. Du kommer då se flera steg/tabs - gå till första steget som heter **"App information"** eller **"OAuth consent screen"**

**Om du inte har konfigurerat det tidigare:**
1. Du kommer se en sida där du väljer **User Type**
2. Välj **External** (eller **Internal** om du bara vill ha användare inom din organisation)
3. Klicka på **CREATE** eller **CONTINUE**
4. Du kommer då till första steget där du kan fylla i app-information

### Steg 3: Fyll i App Information

På första steget/tabben ("App information" eller "OAuth consent screen"):

1. **App name** (detta är det viktiga fältet!):
   - Skriv: `Elbespararen`
   - Detta är vad som kommer visas i Google OAuth-dialogen

2. **User support email**:
   - Välj din e-postadress från dropdown-menyn
   - Eller skriv in: `vkngltd@gmail.com`

3. **App logo** (valfritt):
   - Ladda upp Elbespararen-logotypen om du vill

4. **App domain** (valfritt):
   - `elbespararen.se`

5. **Application home page** (valfritt):
   - `https://elbespararen.se`

6. **Application privacy policy link** (valfritt):
   - `https://elbespararen.se/privacy`

7. **Application terms of service link** (valfritt):
   - `https://elbespararen.se/cookies`

8. **Authorized domains**:
   - `elbespararen.se` (ska redan vara där)
   - `tptwyuywgchxcjxybmya.supabase.co` (ska vara där för Supabase OAuth)

9. **Developer contact information**:
   - Din e-postadress: `vkngltd@gmail.com`

### Steg 4: Spara ändringar

1. Klicka på **SAVE AND CONTINUE** (eller bara **SAVE** om du redigerar)
2. Om appen är i "Testing" mode:
   - Gå till **Test users**-steget/tabben
   - Lägg till din e-post (`hazzler@gmail.com` eller `velvetorionx@gmail.com`) som testanvändare
   - Spara igen

### Steg 5: Vänta på att ändringarna träder i kraft

- Det kan ta några minuter (upp till 5-10 minuter) innan ändringarna syns i OAuth-dialogen
- Om du ändrar från "Testing" till "In production", kan det ta längre tid (upp till några dagar för Google-granskning)

## Viktigt om Supabase Redirect

**OBS:** Google kommer fortfarande visa Supabase-URL:en (`tptwyuywgchxcjxybmya.supabase.co`) i dialogen eftersom det är den domain som används för OAuth redirect. Detta är normalt beteende och kan inte ändras helt.

Men app-namnet "Elbespararen" kommer visas i:
- OAuth consent screen (när användaren ger tillstånd)
- Google Account-sidan där användaren ser vilka appar de har gett tillstånd till

## Supabase Site URL Konfiguration

För att säkerställa att redirects fungerar korrekt:

1. **Gå till Supabase Dashboard**
   - Öppna [Supabase Dashboard](https://app.supabase.com/)
   - Välj ditt projekt

2. **Gå till Authentication Settings**
   - **Authentication** > **URL Configuration**

3. **Konfigurera Site URL**
   - **Site URL**: `http://localhost:3000` (för utveckling) eller `https://elbespararen.se` (för produktion)
   - **VIKTIGT:** Lägg INTE till `/api/auth/callback` här - bara domänen!

4. **Redirect URLs** (om detta fält finns):
   - Lägg till: `http://localhost:3000/api/auth/callback` (för utveckling)
   - Lägg till: `https://elbespararen.se/api/auth/callback` (för produktion)

5. **Spara ändringar**

## Felsökning

**Jag hittar inte "App name"-fältet:**
- Se till att du är i **APIs & Services** > **OAuth consent screen** (INTE "Google Auth Platform" > "Branding")
- Om du redigerar en befintlig app, klicka på **"EDIT APP"** knappen först

**Ändringarna syns inte:**
- Vänta 5-10 minuter
- Rensa cookies och testa igen
- Logga ut och in igen i Google
