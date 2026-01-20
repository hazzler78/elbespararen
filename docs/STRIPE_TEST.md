# 🧪 Stripe Integration - Snabb Testguide

Denna guide hjälper dig att snabbt testa Stripe-integrationen efter att du har konfigurerat environment variables.

---

## ✅ Förutsättningar

- [x] Stripe-nycklar satta i `.env.local` (för lokal utveckling)
- [x] Stripe-nycklar satta i Cloudflare Pages (för produktion)
- [x] Stripe CLI installerat (för lokal webhook-testning)

---

## 🧪 Testa Lokalt

### Steg 1: Starta Dev-servern

```bash
npm run dev
```

### Steg 2: Starta Stripe Webhook Forwarding

I en **ny terminal**, kör:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**VIKTIGT:** Stripe CLI kommer visa en `whsec_...` secret. Kopiera denna och lägg till i `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_din_secret_här
```

Starta om dev-servern efter att du har lagt till webhook secret.

### Steg 3: Testa Checkout

1. Gå till `http://localhost:3000/premium`
2. Logga in om du inte redan är inloggad
3. Klicka på **"Uppgradera nu"**
4. Du bör redirectas till Stripe Checkout

### Steg 4: Använd Test-kort

I Stripe Checkout, använd följande test-kort:

- **Kortnummer:** `4242 4242 4242 4242`
- **Utgångsdatum:** Valfritt framtida datum (t.ex. `12/34`)
- **CVC:** Valfritt 3-siffrigt nummer (t.ex. `123`)
- **ZIP:** Valfritt (t.ex. `12345`)

### Steg 5: Verifiera Resultat

Efter betalning:

1. Du bör redirectas till `/premium/success`
2. Kontrollera terminal-loggarna:
   - Du bör se `[Stripe Webhook] Checkout completed for user: ...`
   - Du bör se `[Stripe Webhook] User ... upgraded to premium`
3. Kontrollera att din användare har premium-status:
   - Gå till `/dashboard`
   - Du bör se Premium-badge
   - Export-knappar bör vara aktiva

---

## 🌐 Testa i Produktion

### Steg 1: Konfigurera Webhook i Stripe Dashboard

1. Gå till Stripe Dashboard > **Developers > Webhooks**
2. Klicka på **Add endpoint**
3. Ange endpoint URL:
   ```
   https://elbespararen.se/api/stripe/webhook
   ```
4. Välj events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Klicka på **Add endpoint**
6. Kopiera **Signing secret** (`whsec_...`)
7. Lägg till i Cloudflare Pages environment variables som `STRIPE_WEBHOOK_SECRET`

### Steg 2: Deploy

```bash
npm run build:cloudflare
npm run deploy
```

Eller pusha till GitHub för automatisk deployment.

### Steg 3: Testa i Produktion

1. Gå till `https://elbespararen.se/premium`
2. Logga in
3. Klicka på **"Uppgradera nu"**
4. Använd samma test-kort som ovan
5. Verifiera att premium-status aktiveras

---

## 🔍 Troubleshooting

### "Stripe is not configured" error

**Lösning:**
- Kontrollera att `STRIPE_SECRET_KEY` är satt i `.env.local` (lokalt) eller Cloudflare Pages (produktion)
- Starta om dev-servern efter att ha lagt till environment variables

### Webhook verifierar inte signaturen

**Lösning:**
- För lokal utveckling: Använd Stripe CLI och kopiera den `whsec_...` som visas
- För produktion: Kopiera signing secret från Stripe Dashboard > Webhooks > Din endpoint
- Kontrollera att `STRIPE_WEBHOOK_SECRET` är korrekt satt

### Checkout-session skapas inte

**Lösning:**
- Kontrollera browser console för felmeddelanden
- Kontrollera server logs i terminalen
- Kontrollera att användaren är inloggad
- Kontrollera att `STRIPE_SECRET_KEY` är korrekt satt

### Premium-status aktiveras inte efter betalning

**Lösning:**
- Kontrollera att webhook-endpointen är korrekt konfigurerad
- Kontrollera att webhook events är valda i Stripe Dashboard
- Kontrollera server logs för webhook-fel
- För lokal utveckling: Se till att Stripe CLI körs och forwardar till rätt URL
- Vänta några sekunder - webhook kan ta lite tid att processa

### "Cannot read properties of null" eller liknande

**Lösning:**
- Detta kan bero på att Stripe-instansen är null vid modul-laddning i Edge runtime
- Koden är nu uppdaterad för att hantera detta korrekt
- Starta om dev-servern om du fortfarande ser detta fel

---

## 📊 Verifiera i Stripe Dashboard

Efter en lyckad betalning kan du verifiera i Stripe Dashboard:

1. Gå till **Payments** - du bör se betalningen
2. Gå till **Customers** - du bör se en ny kund med din e-post
3. Gå till **Subscriptions** - du bör se en aktiv prenumeration
4. Gå till **Webhooks** - du bör se webhook events som har levererats

---

## ✅ Checklista

- [ ] Dev-servern startar utan fel
- [ ] Stripe CLI körs och forwardar webhooks
- [ ] Webhook secret är satt i `.env.local`
- [ ] Checkout-session skapas när jag klickar på "Uppgradera nu"
- [ ] Stripe Checkout-sidan visas korrekt
- [ ] Test-betalning genomförs utan fel
- [ ] Redirect till `/premium/success` fungerar
- [ ] Premium-status aktiveras i databasen
- [ ] Dashboard visar Premium-badge
- [ ] Export-funktioner är aktiva

---

## 🎉 Klart!

Om alla steg fungerar, är din Stripe-integration klar! Du kan nu ta emot betalningar för Premium-prenumerationer.
