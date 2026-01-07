# 🔧 Fix: Invalid origin error i Google OAuth

## Problemet

Du får felet: **"Invalid origin: URIs must not contain a path or end with '/'."**

Detta händer när du försöker lägga till callback-URL:en i fel fält.

---

## Lösning

### ❌ FEL:
```
Authorized JavaScript origins:
https://elbespararen.se/api/auth/callback/google  ← FEL!
```

### ✅ RÄTT:

**1. Authorized JavaScript origins** (bara domän, INGEN path):
```
https://elbespararen.se
http://localhost:3000
```

**2. Authorized redirect URIs** (MED full path):
```
https://elbespararen.se/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

---

## Steg-för-steg fix

1. **Ta bort felaktig URI från "Authorized JavaScript origins"**
   - Ta bort: `https://elbespararen.se/api/auth/callback/google`
   - Lägg till: `https://elbespararen.se` (utan path)

2. **Lägg till callback-URL i "Authorized redirect URIs"**
   - Lägg till: `https://elbespararen.se/api/auth/callback/google` (med full path)

3. **För utveckling, lägg också till:**
   - JavaScript origin: `http://localhost:3000`
   - Redirect URI: `http://localhost:3000/api/auth/callback/google`

4. **Klicka på "Create"**

---

## Skillnaden mellan fälten

### Authorized JavaScript origins
- **Vad:** Domänen där din app körs
- **Format:** Bara domän, INGEN path
- **Exempel:** `https://elbespararen.se`
- **Används för:** CORS-requests från webbläsaren

### Authorized redirect URIs
- **Vad:** Full URL där Google skickar användaren efter inloggning
- **Format:** Full URL med path
- **Exempel:** `https://elbespararen.se/api/auth/callback/google`
- **Används för:** OAuth callback efter autentisering

---

## Exempel på korrekt konfiguration

```
Application type: Web application
Name: Elbespararen

Authorized JavaScript origins:
  https://elbespararen.se
  http://localhost:3000

Authorized redirect URIs:
  https://elbespararen.se/api/auth/callback/google
  http://localhost:3000/api/auth/callback/google
```

---

## Efter fix

Efter att du har fixat detta:
1. Klicka "Create"
2. Kopiera Client ID och Client Secret
3. Lägg till i `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=ditt_client_id_här
   GOOGLE_CLIENT_SECRET=ditt_client_secret_här
   ```
4. Testa inloggning på `/auth/signin`
