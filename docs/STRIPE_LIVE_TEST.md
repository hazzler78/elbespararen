# 🚀 Stripe Live Test - Snabbguide

Denna guide hjälper dig att testa Stripe-integrationen direkt i produktion.

---

## ✅ Pre-flight Checklist

Innan du testar live, kontrollera att:

- [x] Stripe-nycklar är satta i Cloudflare Pages environment variables
  - `STRIPE_SECRET_KEY` (test eller live key)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test eller live key)
  - `STRIPE_WEBHOOK_SECRET` (kommer från Stripe Dashboard)

- [x] Koden är committad och pushad till GitHub
- [x] Cloudflare Pages deployment är klar

---

## 🔧 Steg 1: Konfigurera Webhook i Stripe Dashboard

**VIKTIGT:** Webhook måste konfigureras innan du testar!

1. Gå till [Stripe Dashboard](https://dashboard.stripe.com/)
2. Se till att du är i **Test mode** (om du använder test-nycklar) eller **Live mode** (om du använder live-nycklar)
3. Gå till **Developers > Webhooks**
4. Klicka på **Add endpoint**
5. Ange endpoint URL:
   ```
   https://elbespararen.se/api/stripe/webhook
   ```
6. Välj events att lyssna på:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
7. Klicka på **Add endpoint**
8. **Kopiera Signing secret** (`whsec_...`) som visas
9. Lägg till i Cloudflare Pages:
   - Gå till Cloudflare Dashboard > Ditt projekt > **Settings > Environment Variables**
   - Lägg till: `STRIPE_WEBHOOK_SECRET` = `whsec_din_secret_här`
   - **VIKTIGT:** Välj **Production** environment
   - Klicka **Save**

---

## 🚀 Steg 2: Deploya Koden

Om du inte redan har deployat:

```bash
git add .
git commit -m "Stripe integration ready for production"
git push
```

Cloudflare Pages kommer automatiskt att deploya när du pushar till `main` branch.

**Eller** om du behöver trigga en ny deployment manuellt:
1. Gå till Cloudflare Dashboard > Ditt projekt > **Deployments**
2. Klicka på **Retry deployment** på den senaste deploymenten

---

## 🧪 Steg 3: Testa Checkout

### 3.1 Gå till Premium-sidan

1. Öppna `https://elbespararen.se/premium`
2. Logga in om du inte redan är inloggad
3. Kontrollera att du ser "Uppgradera nu"-knappen

### 3.2 Starta Checkout

1. Klicka på **"Uppgradera nu"**
2. Du bör redirectas till Stripe Checkout-sidan
3. Om du ser ett fel, kontrollera:
   - Browser console (F12) för felmeddelanden
   - Cloudflare Pages logs för server-fel

### 3.3 Använd Test-kort

**OBS:** Även om du testar live kan du använda Stripe test-kort om du använder test-nycklar!

I Stripe Checkout, använd:

- **Kortnummer:** `4242 4242 4242 4242`
- **Utgångsdatum:** Valfritt framtida datum (t.ex. `12/34`)
- **CVC:** Valfritt 3-siffrigt nummer (t.ex. `123`)
- **ZIP:** Valfritt (t.ex. `12345`)

Klicka på **Subscribe** eller **Pay**.

### 3.4 Verifiera Success

Efter betalning:

1. Du bör redirectas till `/premium/success`
2. Sidan bör visa "Tack för din prenumeration!"
3. Kontrollera att premium-status är aktiv:
   - Gå till `/dashboard`
   - Du bör se Premium-badge
   - Export-knappar bör vara aktiva

---

## 🔍 Steg 4: Verifiera Webhook

### 4.1 I Stripe Dashboard

1. Gå till **Developers > Webhooks**
2. Klicka på din webhook endpoint
3. Scrolla ner till **Recent events**
4. Du bör se:
   - `checkout.session.completed` event
   - Status: **Succeeded** (grön)

Om event har status **Failed**:
- Klicka på eventet för att se detaljer
- Kontrollera felmeddelandet
- Kontrollera att `STRIPE_WEBHOOK_SECRET` är korrekt satt i Cloudflare Pages

### 4.2 I Cloudflare Pages Logs

1. Gå till Cloudflare Dashboard > Ditt projekt > **Logs**
2. Sök efter `[Stripe Webhook]` i loggarna
3. Du bör se:
   - `[Stripe Webhook] Checkout completed for user: ...`
   - `[Stripe Webhook] User ... upgraded to premium`

---

## 🐛 Troubleshooting

### Problem: "Stripe is not configured"

**Lösning:**
- Kontrollera att `STRIPE_SECRET_KEY` är satt i Cloudflare Pages
- Kontrollera att du har valt **Production** environment
- Starta om deployment efter att ha lagt till environment variables

### Problem: Checkout-session skapas inte

**Lösning:**
- Öppna browser console (F12) och kontrollera för fel
- Kontrollera Cloudflare Pages logs
- Kontrollera att användaren är inloggad
- Kontrollera att `STRIPE_SECRET_KEY` är korrekt satt

### Problem: Webhook events misslyckas

**Lösning:**
- Kontrollera att `STRIPE_WEBHOOK_SECRET` är korrekt satt i Cloudflare Pages
- Kontrollera att webhook URL är korrekt i Stripe Dashboard
- Kontrollera att webhook events är valda (`checkout.session.completed`, etc.)
- Kontrollera Cloudflare Pages logs för webhook-fel

### Problem: Premium-status aktiveras inte

**Lösning:**
- Vänta några sekunder - webhook kan ta lite tid att processa
- Kontrollera Stripe Dashboard > Webhooks > Recent events
- Kontrollera att webhook event har status **Succeeded**
- Kontrollera Cloudflare Pages logs för webhook-meddelanden
- Om webhook misslyckas, kontrollera att databas-bindingen är korrekt

### Problem: "Cannot read properties of null"

**Lösning:**
- Detta kan bero på att Stripe-instansen är null
- Kontrollera att `STRIPE_SECRET_KEY` är korrekt satt
- Starta om deployment

---

## ✅ Verifierings-checklista

Efter test:

- [ ] Checkout-session skapas utan fel
- [ ] Stripe Checkout-sidan visas korrekt
- [ ] Test-betalning genomförs utan fel
- [ ] Redirect till `/premium/success` fungerar
- [ ] Webhook event `checkout.session.completed` har status **Succeeded** i Stripe Dashboard
- [ ] Premium-status aktiveras i databasen
- [ ] Dashboard visar Premium-badge
- [ ] Export-funktioner är aktiva

---

## 🎉 Klart!

Om alla steg fungerar, är din Stripe-integration klar för produktion! 🚀

---

## 📝 Ytterligare Tips

### Test vs Live Keys

- **Test keys** (`sk_test_...`, `pk_test_...`): Använd för testning, även i produktion
- **Live keys** (`sk_live_...`, `pk_live_...`): Använd för riktiga betalningar

**Rekommendation:** Börja med test keys även i produktion för att testa integrationen säkert.

### Övervaka Webhooks

- Stripe Dashboard > Webhooks visar alla events
- Du kan se när webhooks levereras och om de misslyckas
- Använd detta för att debugga problem

### Testa Olika Scenarion

- Testa att betala med olika test-kort
- Testa att avbryta checkout (cancel)
- Testa subscription renewal (om du har månadsvis prenumeration)

---

## 🔗 Ytterligare Resurser

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Cloudflare Pages Logs](https://dash.cloudflare.com/)
