# 💳 Stripe Integration Setup Guide

Denna guide visar hur du konfigurerar Stripe-betalningar för Premium-prenumerationer.

---

## 📋 Steg 1: Skapa Stripe-konto

1. Gå till [stripe.com](https://stripe.com) och skapa ett konto
2. Aktivera ditt konto och fyll i företagsinformation
3. Gå till **Developers > API keys** i Stripe Dashboard

---

## 🔑 Steg 2: Hämta API-nycklar

### Test-nycklar (för utveckling)

1. I Stripe Dashboard, se till att du är i **Test mode** (växla i övre högra hörnet)
2. Kopiera följande nycklar:
   - **Secret key** (börjar med `sk_test_...`)
   - **Publishable key** (börjar med `pk_test_...`)

### Live-nycklar (för produktion)

1. Växla till **Live mode** i Stripe Dashboard
2. Kopiera följande nycklar:
   - **Secret key** (börjar med `sk_live_...`)
   - **Publishable key** (börjar med `pk_live_...`)

---

## 🌐 Steg 3: Konfigurera Environment Variables

### Lokal utveckling (.env.local)

Lägg till följande i din `.env.local`-fil:

```bash
# Stripe Test Keys (för utveckling)
STRIPE_SECRET_KEY=sk_test_din_test_secret_key_här
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_din_test_publishable_key_här

# Stripe Webhook Secret (se Steg 4)
STRIPE_WEBHOOK_SECRET=whsec_din_webhook_secret_här
```

### Produktion (Cloudflare Pages)

1. Gå till Cloudflare Dashboard > Ditt projekt > **Settings > Environment Variables**
2. Lägg till följande variabler för **Production**:
   - `STRIPE_SECRET_KEY` = din live secret key (`sk_live_...`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = din live publishable key (`pk_live_...`)
   - `STRIPE_WEBHOOK_SECRET` = din webhook secret (se Steg 4)

---

## 🔔 Steg 4: Konfigurera Webhooks

Webhooks låter Stripe meddela din applikation när betalningar genomförs eller prenumerationer uppdateras.

### För lokal utveckling (använd Stripe CLI)

1. **Installera Stripe CLI:**
   ```bash
   # Windows (med Chocolatey)
   choco install stripe

   # macOS (med Homebrew)
   brew install stripe/stripe-cli/stripe

   # Eller ladda ner från: https://stripe.com/docs/stripe-cli
   ```

2. **Logga in på Stripe CLI:**
   ```bash
   stripe login
   ```

3. **Starta webhook forwarding:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Kopiera webhook signing secret:**
   Stripe CLI kommer visa en `whsec_...` secret. Kopiera denna och lägg till i `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_din_secret_här
   ```

### För produktion (Cloudflare Pages)

1. Gå till Stripe Dashboard > **Developers > Webhooks**
2. Klicka på **Add endpoint**
3. Ange endpoint URL:
   ```
   https://elbespararen.se/api/stripe/webhook
   ```
4. Välj events att lyssna på:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Klicka på **Add endpoint**
6. Klicka på den nya webhook-endpointen och kopiera **Signing secret** (`whsec_...`)
7. Lägg till denna secret i Cloudflare Pages environment variables som `STRIPE_WEBHOOK_SECRET`

---

## 💰 Steg 5: Skapa Produkt och Pris i Stripe

1. Gå till Stripe Dashboard > **Products**
2. Klicka på **Add product**
3. Fyll i:
   - **Name:** Elbespararen Premium
   - **Description:** Årsprenumeration med obegränsad historik, export-funktioner och avancerad analys
   - **Pricing model:** Standard pricing
   - **Price:** 99.00 SEK
   - **Billing period:** Yearly
4. Klicka på **Save product**

**OBS:** För nu använder koden `price_data` direkt i checkout-session, så du behöver inte skapa ett produkt i Stripe Dashboard. Men om du vill använda ett fördefinierat pris kan du skapa det och uppdatera koden i `src/lib/stripe.ts`.

---

## 🧪 Steg 6: Testa Integrationen

### Testa lokalt

1. Starta dev-servern:
   ```bash
   npm run dev
   ```

2. I en annan terminal, starta Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Gå till `http://localhost:3000/premium`
4. Klicka på "Uppgradera nu"
5. Använd Stripe test-kort:
   - **Kortnummer:** `4242 4242 4242 4242`
   - **Utgångsdatum:** Valfritt framtida datum (t.ex. `12/34`)
   - **CVC:** Valfritt 3-siffrigt nummer (t.ex. `123`)
   - **ZIP:** Valfritt (t.ex. `12345`)

6. Efter betalning bör du redirectas till `/premium/success`
7. Kontrollera att din användare har fått premium-status i databasen

### Testa webhooks lokalt

1. I Stripe CLI-terminalen, skicka en test-event:
   ```bash
   stripe trigger checkout.session.completed
   ```

2. Kontrollera att webhook-endpointen tar emot eventet korrekt

---

## 🚀 Steg 7: Deploy till Produktion

1. **Sätt live Stripe-nycklar i Cloudflare Pages:**
   - Gå till Cloudflare Dashboard > Ditt projekt > Settings > Environment Variables
   - Uppdatera `STRIPE_SECRET_KEY` och `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` med live-nycklar
   - Sätt `STRIPE_WEBHOOK_SECRET` med webhook secret från produktion

2. **Konfigurera webhook i Stripe Dashboard:**
   - Se Steg 4 ovan för instruktioner

3. **Testa med Stripe test-kort i produktion:**
   - Använd samma test-kort som ovan
   - Stripe kommer automatiskt att använda test-nycklar även i produktion om du använder test-kort

---

## 🔍 Troubleshooting

### Webhook verifierar inte signaturen

- Kontrollera att `STRIPE_WEBHOOK_SECRET` är korrekt satt
- För lokal utveckling: använd Stripe CLI och kopiera den `whsec_...` som visas
- För produktion: kopiera signing secret från Stripe Dashboard > Webhooks > Din endpoint

### Checkout-session skapas inte

- Kontrollera att `STRIPE_SECRET_KEY` är korrekt satt
- Kontrollera att användaren är inloggad
- Kontrollera browser console och server logs för felmeddelanden

### Premium-status aktiveras inte efter betalning

- Kontrollera att webhook-endpointen är korrekt konfigurerad
- Kontrollera att webhook events är valda (`checkout.session.completed`)
- Kontrollera server logs för webhook-fel
- För lokal utveckling: se till att Stripe CLI körs och forwardar till rätt URL

### "Stripe is not configured" error

- Kontrollera att `STRIPE_SECRET_KEY` är satt i environment variables
- För lokal utveckling: kontrollera `.env.local`
- För produktion: kontrollera Cloudflare Pages environment variables

---

## 📚 Ytterligare Resurser

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

---

## ✅ Checklista

- [ ] Stripe-konto skapat
- [ ] Test API-nycklar hämtade
- [ ] Environment variables satta lokalt (.env.local)
- [ ] Stripe CLI installerat och konfigurerat (för lokal utveckling)
- [ ] Webhook forwarding fungerar lokalt
- [ ] Test-betalning fungerar lokalt
- [ ] Live API-nycklar hämtade
- [ ] Environment variables satta i produktion (Cloudflare Pages)
- [ ] Webhook konfigurerad i Stripe Dashboard för produktion
- [ ] Test-betalning fungerar i produktion
