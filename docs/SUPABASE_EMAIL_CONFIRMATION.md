# Supabase E-postbekräftelse - Instruktioner

## Problem

Om användare kan registrera sig men inte logga in direkt efter registrering, beror det troligen på att Supabase kräver e-postbekräftelse som standard.

## Lösning: Inaktivera e-postbekräftelse (för development/testing)

### Steg 1: Gå till Supabase Dashboard

1. Öppna [Supabase Dashboard](https://app.supabase.com/)
2. Välj ditt projekt (ELbasen)
3. Gå till **Authentication** > **Providers** i menyn

### Steg 2: Inaktivera e-postbekräftelse

1. Scrolla ner till **Email** provider
2. Hitta inställningen **"Confirm email"** eller **"Enable email confirmations"**
3. **Stäng av** denna inställning (toggle till OFF)
4. Klicka på **Save**

### Steg 3: Verifiera

Efter att ha inaktiverat e-postbekräftelse:
- Nya användare kan logga in direkt efter registrering
- Inga bekräftelselänkar skickas via e-post
- Användare är automatiskt verifierade när de registrerar sig

## Alternativ: Behålla e-postbekräftelse men förbättra UX

Om du vill behålla e-postbekräftelse för säkerhet:

1. **Förbättra felmeddelanden** (redan implementerat):
   - Användare får tydligt meddelande om att de måste bekräfta e-post
   - E-postadressen visas i meddelandet

2. **Lägg till "Skicka bekräftelselänk igen"-funktion**:
   - Skapa en sida `/auth/resend-confirmation`
   - Använd Supabase `resend()` funktion

3. **Automatisk redirect efter bekräftelse**:
   - När användaren klickar på bekräftelselänken, redirecta dem direkt till dashboard

## Produktion

För produktion rekommenderas att:
- **Behålla e-postbekräftelse aktiverad** för säkerhet
- Förbättra felmeddelanden och UX (se ovan)
- Lägg till funktion för att skicka bekräftelselänk igen

## Felsökning

Om användare fortfarande inte kan logga in efter att ha inaktiverat e-postbekräftelse:

1. Kontrollera Supabase Dashboard > Authentication > Users
2. Verifiera att användaren finns och är "confirmed"
3. Kontrollera att lösenordet är korrekt
4. Kontrollera browser console för felmeddelanden
5. Kontrollera Supabase logs för autentiseringsfel
