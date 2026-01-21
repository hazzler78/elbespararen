# ✅ Verifiera Stripe Integration i Dashboard

Denna guide visar exakt var du ska kolla i Stripe Dashboard för att verifiera att integrationen fungerar.

---

## 🎯 Efter en Lyckad Betalning

Efter att en användare har betalat för Premium, kan du verifiera i Stripe Dashboard på följande sätt:

---

## 1️⃣ Payments (Betalningar)

**Var:** Stripe Dashboard > **Payments**

**Vad du ser:**
- En ny betalning med status **Succeeded** (grön)
- Belopp: **99.00 SEK**
- Beskrivning: "Elbespararen Premium"
- Betalningsmetod: Kort (t.ex. Visa ending in 4242 om test-kort)

**Hur du hittar det:**
1. Gå till [Stripe Dashboard](https://dashboard.stripe.com/)
2. Klicka på **Payments** i vänstermenyn
3. Du ser alla betalningar, senaste först
4. Klicka på en betalning för att se detaljer

**Vad du kan se i detaljerna:**
- **Customer:** E-postadressen till användaren
- **Amount:** 99.00 SEK
- **Status:** Succeeded
- **Created:** Tidsstämpel för när betalningen gjordes
- **Payment method:** Kortinformation

---

## 2️⃣ Customers (Kunder)

**Var:** Stripe Dashboard > **Customers**

**Vad du ser:**
- En ny kund med e-postadressen till användaren
- Metadata med `userId` från din applikation
- En aktiv prenumeration länkad till kunden

**Hur du hittar det:**
1. Gå till **Customers** i vänstermenyn
2. Du ser alla kunder, senaste först
3. Klicka på en kund för att se detaljer

**Vad du kan se i detaljerna:**
- **Email:** Användarens e-postadress
- **Created:** När kunden skapades
- **Metadata:**
  - `userId`: Användarens ID från din databas
- **Subscriptions:** Lista över aktiva prenumerationer

**OBS:** Om användaren redan finns som kund (t.ex. från tidigare betalning), kommer den befintliga kunden att användas istället för att skapa en ny.

---

## 3️⃣ Subscriptions (Prenumerationer)

**Var:** Stripe Dashboard > **Subscriptions**

**Vad du ser:**
- En aktiv prenumeration med status **Active** (grön)
- **Amount:** 99.00 SEK
- **Billing period:** Yearly (årligen)
- **Current period:** Start- och slutdatum för nuvarande period
- **Next payment:** När nästa betalning sker (om 1 år)

**Hur du hittar det:**
1. Gå till **Subscriptions** i vänstermenyn
2. Du ser alla prenumerationer, senaste först
3. Klicka på en prenumeration för att se detaljer

**Vad du kan se i detaljerna:**
- **Status:** Active, Cancelled, Past due, etc.
- **Customer:** Länk till kunden
- **Amount:** 99.00 SEK per år
- **Billing cycle:** Yearly
- **Current period:** Start- och slutdatum
- **Metadata:**
  - `userId`: Användarens ID
  - `userEmail`: Användarens e-post
- **Payment method:** Kort som används för betalning

---

## 4️⃣ Webhooks (Viktigast!)

**Var:** Stripe Dashboard > **Developers > Webhooks**

**Vad du ser:**
- Webhook events med status **Succeeded** (grön)
- Events som `checkout.session.completed` och `customer.subscription.created`

**Hur du hittar det:**
1. Gå till **Developers** i vänstermenyn
2. Klicka på **Webhooks**
3. Klicka på din webhook endpoint (`https://elbespararen.se/api/stripe/webhook`)
4. Scrolla ner till **Recent events**

**Vad du kan se:**

### Event: `checkout.session.completed`
- **Status:** Succeeded (grön) = Webhook levererades korrekt
- **Status:** Failed (röd) = Webhook misslyckades (kolla felmeddelandet)
- **Timestamp:** När eventet skickades
- **Response:** HTTP-statuskod från din server (bör vara 200)

**Klicka på eventet för att se:**
- **Event data:** All data som skickades till din webhook
- **Response:** Vad din server svarade
- **Attempts:** Antal försök att leverera webhook

### Event: `customer.subscription.created`
- Skapas när prenumerationen aktiveras
- Status bör vara **Succeeded**

### Event: `customer.subscription.updated`
- Skapas när prenumerationen uppdateras
- T.ex. när den förnyas eller avbryts

**VIKTIGT:** Om webhook events har status **Failed**, betyder det att:
- Webhook-endpointen kunde inte nås
- Webhook secret är fel
- Server returnerade ett fel
- Kolla Cloudflare Pages logs för detaljer

---

## 5️⃣ Events (Alla Events)

**Var:** Stripe Dashboard > **Developers > Events**

**Vad du ser:**
- Alla events som har skapats i Stripe
- Inkluderar betalningar, prenumerationer, webhooks, etc.

**Hur du hittar det:**
1. Gå till **Developers > Events**
2. Du ser alla events, senaste först
3. Använd filter för att hitta specifika events

**Användbart för debugging:**
- Se alla events i kronologisk ordning
- Se exakt vad som hände när
- Se event-data för debugging

---

## 🔍 Snabb Verifierings-checklista

Efter en betalning, kontrollera:

- [ ] **Payments:** En ny betalning med status "Succeeded"
- [ ] **Customers:** En ny kund (eller befintlig kund uppdaterad)
- [ ] **Subscriptions:** En aktiv prenumeration
- [ ] **Webhooks:** Event `checkout.session.completed` med status "Succeeded"
- [ ] **Webhooks:** Event `customer.subscription.created` med status "Succeeded"

---

## 🐛 Om Något Ser Fel Ut

### Webhook Events Misslyckas

**Symptom:** Webhook events har status **Failed**

**Lösning:**
1. Klicka på det misslyckade eventet
2. Se **Response** för att se felmeddelandet
3. Kontrollera Cloudflare Pages logs
4. Kontrollera att `STRIPE_WEBHOOK_SECRET` är korrekt satt
5. Kontrollera att webhook URL är korrekt (`https://elbespararen.se/api/stripe/webhook`)

### Ingen Betalning Syns

**Symptom:** Användaren säger att de betalade, men ingen betalning syns i Stripe

**Lösning:**
1. Kontrollera att du är i rätt mode (Test mode vs Live mode)
2. Kontrollera att du använder rätt Stripe-konto
3. Kontrollera att `STRIPE_SECRET_KEY` är korrekt satt
4. Kolla browser console för fel när checkout-session skapas

### Premium-status Aktiveras Inte

**Symptom:** Betalning syns i Stripe, men användaren har inte premium i appen

**Lösning:**
1. Kontrollera webhook events - är de levererade?
2. Kontrollera Cloudflare Pages logs för webhook-meddelanden
3. Kontrollera att webhook-endpointen uppdaterar databasen korrekt
4. Kontrollera att databas-bindingen är korrekt i Cloudflare Pages

---

## 📊 Test vs Live Mode

**VIKTIGT:** Stripe har två separata modes:

### Test Mode
- Används för testning
- Test-nycklar (`sk_test_...`, `pk_test_...`)
- Test-betalningar syns bara i Test mode
- Inga riktiga pengar debiteras

### Live Mode
- Används för riktiga betalningar
- Live-nycklar (`sk_live_...`, `pk_live_...`)
- Riktiga betalningar syns bara i Live mode
- Riktiga pengar debiteras

**Kontrollera vilket mode du är i:**
- Titta på övre högra hörnet i Stripe Dashboard
- Växla mellan Test och Live mode med switchen

**OBS:** Om du testar med test-kort (`4242 4242 4242 4242`), måste du vara i **Test mode** för att se betalningen!

---

## 🎉 Klart!

Om du ser alla dessa saker i Stripe Dashboard, fungerar din integration perfekt! 🚀

---

## 📝 Ytterligare Tips

### Filtrera Events

I Stripe Dashboard kan du filtrera events:
- **Type:** Välj specifik event-typ (t.ex. `checkout.session.completed`)
- **Status:** Välj status (t.ex. `Succeeded`, `Failed`)
- **Date:** Välj datumintervall

### Exportera Data

Du kan exportera betalningar, kunder och prenumerationer:
- Klicka på **Export** i respektive sektion
- Välj format (CSV, Excel)
- Använd för bokföring eller analys

### Notifikationer

Du kan sätta upp e-postnotifikationer för:
- Nya betalningar
- Misslyckade betalningar
- Webhook-fel
- Gå till **Settings > Notifications** i Stripe Dashboard

---

## 🔗 Ytterligare Resurser

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Events Reference](https://stripe.com/docs/api/events)
