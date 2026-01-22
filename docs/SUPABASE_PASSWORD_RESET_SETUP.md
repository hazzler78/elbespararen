# Supabase Password Reset - Konfigurationsguide

## Problem

När du klickar på återställningslänken i e-postmeddelandet får du felmeddelandet "Ogiltig eller utgången länk".

## Orsak

Supabase validerar `redirectTo`-parametern mot både **Site URL** och **Redirect URLs**. Om URL:en inte finns i Redirect URLs, kommer Supabase att ignorera den och länken blir ogiltig.

## Lösning: Lägg till Password Reset URL i Supabase

### Steg 1: Öppna Supabase Dashboard

1. Gå till [Supabase Dashboard](https://app.supabase.com/)
2. Välj ditt projekt (ELbasen)
3. Klicka på **Authentication** i vänstermenyn
4. Klicka på **URL Configuration** (eller **Configuration** > **URL Configuration**)

### Steg 2: Kontrollera Site URL

**Site URL ska vara:**
```
https://elbespararen.se
```

**VIKTIGT:**
- ✅ Lägg INTE till `/auth/reset-password` här
- ✅ Lägg INTE till `/` i slutet
- ✅ Använd `https://` för produktion (inte `http://`)

### Steg 3: Lägg till Password Reset URL i Redirect URLs

**Redirect URLs ska innehålla ALLA dessa URL:er:**

```
https://elbespararen.se/api/auth/callback
https://elbespararen.se/auth/reset-password
```

**För lokal utveckling (om du testar lokalt):**
```
http://localhost:3000/api/auth/callback
http://localhost:3000/auth/reset-password
```

**VIKTIGT:**
- ✅ Varje URL ska vara på en egen rad eller separerad med komma
- ✅ Kontrollera att det inte finns extra mellanslag eller `/` i slutet
- ✅ För produktion: använd `https://` (inte `http://`)
- ✅ För localhost: använd `http://` (inte `https://`)

### Steg 4: Spara ändringar

1. Klicka på **Save changes** eller **Update**
2. **Vänta 1-2 minuter** för att Supabase ska uppdatera inställningarna

### Steg 5: Testa Password Reset

1. Gå till `/auth/forgot-password`
2. Ange din e-postadress
3. Klicka på "Skicka återställningslänk"
4. Kontrollera din e-post
5. Klicka på länken i e-postmeddelandet
6. Du bör nu komma till `/auth/reset-password` utan felmeddelande

## Varför detta händer

När vi anropar `resetPasswordForEmail()` med:
```typescript
redirectTo: `${window.location.origin}/auth/reset-password`
```

Supabase validerar denna URL mot:
1. **Site URL** - måste matcha domänen (`https://elbespararen.se`)
2. **Redirect URLs** - måste matcha exakt URL:en (`https://elbespararen.se/auth/reset-password`)

Om URL:en inte finns i Redirect URLs, kommer Supabase att:
- Ignorera `redirectTo`-parametern
- Använda Site URL istället (vilket blir `/`)
- Token:en blir ogiltig eftersom den är kopplad till fel URL

## Felsökning

### Problem: Jag får fortfarande "Ogiltig eller utgången länk"

**Kontrollera:**
1. ✅ Site URL är exakt `https://elbespararen.se` (inga extra `/` eller sökvägar)
2. ✅ Redirect URLs innehåller exakt `https://elbespararen.se/auth/reset-password`
3. ✅ Inga extra mellanslag eller `/` i slutet av URL:erna
4. ✅ Du har väntat 1-2 minuter efter att ha sparat ändringarna
5. ✅ Du har begärt en NY återställningslänk (gamla länkar fungerar inte efter ändringar)

### Problem: Jag hittar inte "Redirect URLs"-fältet

**Alternativa namn:**
- "Additional Redirect URLs"
- "Allowed Redirect URLs"
- "Redirect URL Whitelist"
- Kan finnas under "Advanced Settings"

**Om du fortfarande inte hittar det:**
- Kontrollera att du är på rätt sida: **Authentication** > **URL Configuration**
- Om du inte ser det, kan det vara att din Supabase-version har ett annat gränssnitt
- Prova att söka efter "redirect" i Supabase Dashboard

### Problem: Länken fungerar men token:en är ogiltig

Detta kan bero på att:
1. Token:en har gått ut (de är vanligtvis giltiga i 1 timme)
2. Token:en redan har använts (varje token kan bara användas en gång)
3. Du har begärt flera länkar och använder en gammal länk

**Lösning:** Begär en ny återställningslänk och använd den direkt.

## Ytterligare debugging

Om problemet kvarstår efter att du har kontrollerat allt ovan:

1. Öppna Browser DevTools > Network
2. Filtrera på "auth" eller "reset"
3. Begär en ny återställningslänk
4. Klicka på länken i e-postmeddelandet
5. Kontrollera vilken URL Supabase redirectar till
6. Kontrollera om det finns några fel i Console

## Sammanfattning

För att password reset ska fungera behöver du:

1. ✅ **Site URL**: `https://elbespararen.se`
2. ✅ **Redirect URLs** måste innehålla:
   - `https://elbespararen.se/api/auth/callback` (för OAuth)
   - `https://elbespararen.se/auth/reset-password` (för password reset)
3. ✅ Vänta 1-2 minuter efter att ha sparat
4. ✅ Begär en ny återställningslänk efter ändringar
