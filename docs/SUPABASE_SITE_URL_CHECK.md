# Verifiera Supabase Site URL

## Varför Site URL är viktig

Supabase validerar `redirectTo`-parametern mot både **Site URL** och **Redirect URLs**. Om Site URL är fel konfigurerad, kan Supabase ignorera `redirectTo` även om Redirect URLs är korrekt.

## Lokal utveckling vs Produktion

**VIKTIGT:** Du behöver olika inställningar beroende på var du testar:

- **Lokal utveckling** (`npm run dev` på din dator): `http://localhost:3000`
- **Produktion** (live på Cloudflare Pages): `https://elbespararen.se`

**Supabase Site URL kan bara vara EN URL åt gången**, så du behöver växla mellan dem beroende på var du testar.

### Alternativ 1: Använd produktion-URL även lokalt (Rekommenderat)

Om du bara testar i produktion, sätt Site URL till:
```
https://elbespararen.se
```

Då fungerar OAuth både när du testar lokalt (om du redirectar till produktion) och i produktion.

### Alternativ 2: Växla Site URL när du utvecklar lokalt

Om du utvecklar lokalt och vill testa OAuth lokalt:

1. **För lokal utveckling:** Sätt Site URL till `http://localhost:3000`
2. **För produktion:** Ändra Site URL till `https://elbespararen.se`
3. **Kom ihåg att växla tillbaka** när du deployar till produktion!

## Steg för att kontrollera Site URL

### 1. Öppna Supabase Dashboard

1. Gå till [Supabase Dashboard](https://app.supabase.com/)
2. Välj ditt projekt (ELbasen)
3. Klicka på **Authentication** i vänstermenyn
4. Klicka på **URL Configuration**

### 2. Kontrollera Site URL

**För produktion (Rekommenderat):**
```
https://elbespararen.se
```

**För lokal utveckling (om du testar lokalt):**
```
http://localhost:3000
```

**VIKTIGT - Kontrollera följande:**

✅ **Ingen trailing slash** - ska vara `https://elbespararen.se` (INTE `https://elbespararen.se/`)
✅ **Ingen sökväg** - ska vara bara domänen (INTE `https://elbespararen.se/api/auth/callback`)
✅ **Rätt protokoll** - för produktion: `https://` (INTE `http://`)
✅ **Inga mellanslag** - före eller efter URL:en

### 3. Om Site URL är fel

1. Klicka på Site URL-fältet
2. Ta bort allt innehåll
3. Skriv in exakt: `https://elbespararen.se` (för produktion)
4. Klicka på **Save changes**
5. Vänta 1-2 minuter

### 4. Verifiera både Site URL och Redirect URLs

**Site URL (för produktion):**
```
https://elbespararen.se
```

**Redirect URLs (båda ska finnas):**
```
http://localhost:3000/api/auth/callback
https://elbespararen.se/api/auth/callback
```

**OBS:** Redirect URLs kan innehålla flera URL:er, så du kan ha både localhost och produktion där samtidigt!

## Vanliga fel

### Fel 1: Trailing slash
- ❌ `https://elbespararen.se/`
- ✅ `https://elbespararen.se`

### Fel 2: Fel protokoll
- ❌ `http://elbespararen.se` (produktion måste använda HTTPS)
- ✅ `https://elbespararen.se`

### Fel 3: Sökväg i Site URL
- ❌ `https://elbespararen.se/api/auth/callback`
- ✅ `https://elbespararen.se`

### Fel 4: Mellanslag
- ❌ ` https://elbespararen.se ` (mellanslag före/efter)
- ✅ `https://elbespararen.se`

### Fel 5: Använder localhost när produktion är live
- ❌ Site URL: `http://localhost:3000` när du testar i produktion
- ✅ Site URL: `https://elbespararen.se` när produktion är live

## Testa efter ändringar

**För produktion:**
1. Gå till `https://elbespararen.se/auth/signin`
2. Klicka på "Fortsätt med Google"
3. Efter Google-autentisering bör du redirectas till `/api/auth/callback` (inte `/`)

**För lokal utveckling (om Site URL är satt till localhost):**
1. Rensa cookies för `localhost:3000`
2. Gå till `http://localhost:3000/auth/signin`
3. Klicka på "Fortsätt med Google"
4. Efter Google-autentisering bör du redirectas till `/api/auth/callback` (inte `/`)

## Om det fortfarande inte fungerar

Om både Site URL och Redirect URLs är korrekt konfigurerade men du fortfarande hamnar på `/`:

1. **Kontrollera server logs** - Se vad som loggas när du klickar på "Fortsätt med Google"
2. **Kontrollera browser console** - Se om det finns JavaScript-fel
3. **Kontrollera Network tab** - Se vilken URL Google faktiskt redirectar till
4. **Vänta längre** - Supabase kan ta upp till 5 minuter att uppdatera inställningar
