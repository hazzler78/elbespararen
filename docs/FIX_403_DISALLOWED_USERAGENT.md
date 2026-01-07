# 🔧 Fix: 403 disallowed_useragent Error

## Problemet

Du får felet: **"403: disallowed_useragent"** när du försöker logga in med Google.

Detta händer när din OAuth consent screen är i **"Testing"** läge och din email inte är tillagd som test user.

---

## Lösning: Lägg till Test Users

### Steg 1: Gå till Google Cloud Console

1. Öppna [Google Cloud Console](https://console.cloud.google.com/)
2. Välj ditt projekt
3. Gå till **APIs & Services** > **OAuth consent screen**

### Steg 2: Lägg till Test Users

1. Scrolla ner till sektionen **"Test users"**
2. Klicka på **"+ ADD USERS"**
3. Lägg till din email (den du använder för att logga in):
   - `hazzler@gmail.com` (eller din email)
   - Du kan lägga till flera emails om du vill
4. Klicka på **"ADD"**

### Steg 3: Vänta några minuter

- Ändringar kan ta några minuter att aktiveras
- Vänta 2-5 minuter innan du testar igen

### Steg 4: Testa igen

1. Gå tillbaka till din app
2. Försök logga in med Google igen
3. Det bör nu fungera!

---

## Alternativ: Publicera Appen (För Produktion)

Om du vill att **alla** ska kunna logga in (inte bara test users), måste du publicera appen:

### Steg 1: Gå till OAuth Consent Screen

1. Öppna [Google Cloud Console](https://console.cloud.google.com/)
2. Välj ditt projekt
3. Gå till **APIs & Services** > **OAuth consent screen**

### Steg 2: Fyll i Alla Fält

Se till att alla fält är ifyllda:
- **App name**: Elbespararen
- **User support email**: Din email
- **App logo**: (valfritt, men rekommenderat)
- **App domain**: `elbespararen.se`
- **Developer contact information**: Din email

### Steg 3: Lägg till Scopes

Se till att du har lagt till:
- `email`
- `profile`
- `openid`

### Steg 4: Skicka in för Verifiering

1. Scrolla ner till botten av sidan
2. Klicka på **"PUBLISH APP"** eller **"SUBMIT FOR VERIFICATION"**
3. Följ instruktionerna för att skicka in appen

**OBS:** Verifieringsprocessen kan ta flera dagar eller veckor. Under tiden kan du använda "Test users" för att testa.

---

## Snabb Fix (Rekommenderat för Nu)

**För att fixa problemet NU:**

1. Gå till [Google Cloud Console OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scrolla ner till **"Test users"**
3. Klicka på **"+ ADD USERS"**
4. Lägg till: `hazzler@gmail.com`
5. Klicka **"ADD"**
6. Vänta 2-5 minuter
7. Testa igen!

---

## Ytterligare Hjälp

Om problemet kvarstår efter att du har lagt till test users:

1. **Kontrollera att du använder rätt email:**
   - Den email du lägger till som test user måste matcha den email du använder för att logga in med Google

2. **Kontrollera att OAuth consent screen är korrekt konfigurerad:**
   - Se till att "Publishing status" är "Testing" (eller "In production" om du har publicerat)
   - Se till att alla obligatoriska fält är ifyllda

3. **Rensa cookies och testa igen:**
   - Ta bort cookies för `elbespararen.se` i din webbläsare
   - Försök logga in igen

4. **Kontrollera att redirect URIs är korrekt:**
   - Se till att `https://elbespararen.se/api/auth/callback/google` är lagt till i "Authorized redirect URIs"

---

## Vanliga Frågor

**Q: Varför får jag detta fel?**
A: Google blockerar OAuth-förfrågningar från appar som är i "Testing" läge och som inte har användaren som test user. Detta är en säkerhetsåtgärd.

**Q: Kan jag göra appen tillgänglig för alla utan verifiering?**
A: Nej, för att göra appen tillgänglig för alla måste du skicka in den för verifiering till Google. Detta kan ta flera dagar.

**Q: Hur många test users kan jag lägga till?**
A: Du kan lägga till upp till 100 test users i "Testing" läge.

**Q: Fungerar detta lokalt också?**
A: Ja, om du använder samma Google OAuth credentials lokalt måste du också lägga till test users för att det ska fungera.
