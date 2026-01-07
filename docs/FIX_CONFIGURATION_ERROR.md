# 🔧 Fix: Configuration Error (500)

## Problemet

Du får felet: **"GET /api/auth/error?error=Configuration 500"**

Detta betyder att NextAuth inte kan hitta de obligatoriska environment variables.

---

## Lösning: Kontrollera Environment Variables

### Steg 1: Kontrollera Cloudflare Pages Environment Variables

1. Gå till [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Välj ditt projekt (Elbespararen)
3. Gå till **Settings** > **Environment Variables**
4. Kontrollera att följande variabler är satta:

#### Obligatoriska Variabler:

```
GOOGLE_CLIENT_ID=din_google_client_id_här
GOOGLE_CLIENT_SECRET=din_google_client_secret_här
NEXTAUTH_SECRET=din_nextauth_secret_här
NEXTAUTH_URL=https://elbespararen.se
```

### Steg 2: Verifiera Värdena

**GOOGLE_CLIENT_ID:**
- Börjar med något som `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- Hittar du i [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**GOOGLE_CLIENT_SECRET:**
- En lång sträng med bokstäver och siffror
- Hittar du i [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**NEXTAUTH_SECRET:**
- En säker slumpmässig sträng (minst 32 tecken)
- Generera med: `openssl rand -base64 32`
- Eller på Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`

**NEXTAUTH_URL:**
- Ska vara din produktions-URL: `https://elbespararen.se`
- **VIKTIGT:** Använd `https://` inte `http://`

### Steg 3: Lägg till Saknade Variabler

Om någon variabel saknas:

1. Klicka på **"Add variable"** i Cloudflare Pages
2. Lägg till variabeln med rätt namn och värde
3. **VIKTIGT:** Se till att variabeln är satt för **Production** environment
4. Klicka på **"Save"**

### Steg 4: Triggera Ny Deployment

Efter att du har lagt till/uppdaterat environment variables:

1. Gå till **Deployments** i Cloudflare Pages
2. Klicka på **"Retry deployment"** på den senaste deploymenten
3. Eller gör en ny commit och push för att trigga ny deployment

---

## Lokal Testning

För att testa lokalt, kontrollera att din `.env.local` fil innehåller:

```env
GOOGLE_CLIENT_ID=din_client_id_här
GOOGLE_CLIENT_SECRET=din_client_secret_här
NEXTAUTH_SECRET=din_secret_här
NEXTAUTH_URL=http://localhost:3000
```

**OBS:** Lokalt använder du `http://localhost:3000`, i produktion använder du `https://elbespararen.se`

---

## Vanliga Fel

### Variabeln är satt men fungerar inte

**Problem:** Variabeln är satt men NextAuth kan fortfarande inte läsa den.

**Lösning:**
- Kontrollera att variabeln är satt för **Production** environment (inte bara Preview)
- Se till att det inte finns extra mellanslag eller citattecken runt värdet
- Triggera en ny deployment efter att ha ändrat variabler

### NEXTAUTH_SECRET är för kort

**Problem:** NEXTAUTH_SECRET måste vara minst 32 tecken.

**Lösning:**
- Generera en ny secret med: `openssl rand -base64 32`
- Uppdatera variabeln i Cloudflare Pages
- Triggera ny deployment

### NEXTAUTH_URL är fel

**Problem:** NEXTAUTH_URL måste matcha din faktiska domän.

**Lösning:**
- För produktion: `https://elbespararen.se` (med https://)
- För lokal utveckling: `http://localhost:3000` (med http://)
- Se till att det inte finns ett avslutande `/` i slutet

---

## Ytterligare Hjälp

Om problemet kvarstår efter att du har kontrollerat alla variabler:

1. **Kontrollera build logs:**
   - Gå till Cloudflare Pages > Deployments
   - Klicka på den senaste deploymenten
   - Kolla "Build logs" för felmeddelanden

2. **Kontrollera runtime logs:**
   - Gå till Cloudflare Pages > Functions
   - Kolla "Logs" för runtime-fel

3. **Testa lokalt:**
   - Kör `npm run dev` lokalt
   - Kontrollera att det fungerar med lokala environment variables
   - Om det fungerar lokalt men inte i produktion, är det troligen ett problem med Cloudflare Pages environment variables

---

## Snabb Checklista

- [ ] `GOOGLE_CLIENT_ID` är satt i Cloudflare Pages
- [ ] `GOOGLE_CLIENT_SECRET` är satt i Cloudflare Pages
- [ ] `NEXTAUTH_SECRET` är satt i Cloudflare Pages (minst 32 tecken)
- [ ] `NEXTAUTH_URL` är satt till `https://elbespararen.se` i Cloudflare Pages
- [ ] Alla variabler är satta för **Production** environment
- [ ] Du har triggat en ny deployment efter att ha ändrat variabler
