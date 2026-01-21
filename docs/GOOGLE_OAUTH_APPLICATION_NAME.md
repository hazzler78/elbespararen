# Ändra Google OAuth Application Name till "Elbespararen"

## Problem
När du loggar in med Google visas Supabase-projektets URL (`tptwyuywgchxcjxybmya.supabase.co`) istället för "Elbespararen" i Google OAuth-dialogen.

## Lösning: Uppdatera OAuth Consent Screen i Google Cloud Console

1. **Gå till Google Cloud Console**
   - Öppna [Google Cloud Console](https://console.cloud.google.com/)
   - Välj ditt projekt

2. **Öppna OAuth Consent Screen**
   - Gå till **APIs & Services** > **OAuth consent screen**
   - Om du inte har konfigurerat detta tidigare, välj **External** (eller **Internal** om du bara vill ha användare inom din organisation)

3. **Fyll i App Information**
   - **App name**: `Elbespararen`
   - **User support email**: Välj din e-postadress
   - **App logo** (valfritt): Ladda upp Elbespararen-logotypen om du vill
   - **App domain** (valfritt): `elbespararen.se`
   - **Developer contact information**: Din e-postadress

4. **Spara ändringar**
   - Klicka på **Save and Continue**
   - Om appen är i "Testing" mode, lägg till testanvändare (din e-post) i **Test users**-sektionen

5. **Vänta på att ändringarna träder i kraft**
   - Det kan ta några minuter innan ändringarna syns i OAuth-dialogen
   - Om du ändrar från "Testing" till "In production", kan det ta längre tid (upp till några dagar för Google-granskning)

## Resultat
Efter ändringarna kommer Google OAuth-dialogen att visa "Elbespararen" istället för Supabase-URL:en.
