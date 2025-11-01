# 📱 Mobil Test Checklista - Elbespararen

Använd denna checklista för att testa att alla funktioner fungerar korrekt på mobil (telefon/tablet).

---

## 🔧 Förberedelser

- [ ] Öppna Chrome DevTools (F12) eller använd mobil emulator
- [ ] Sätt viewport till mobil (t.ex. iPhone 12 Pro, 390x844)
- [ ] Testa både portrait och landscape-läge
- [ ] Testa på faktisk mobiltelefon (iOS och Android om möjligt)

---

## 🏠 STARTSIDA (`/`)

### Hero-sektion
- [ ] Hero-text är läsbar och inte för liten
- [ ] "Ladda upp din faktura"-knappen är synlig och klickbar
- [ ] Knappen har korrekt storlek för touch (minst 44x44px)
- [ ] Logo/titel är synlig och korrekt positionerad

### "Så fungerar det"-sektionen
- [ ] Alla 3 steg är synliga
- [ ] Ikoner och text är läsbara
- [ ] Layout fungerar i både portrait och landscape

### Fördelar-sektion
- [ ] Alla fördelar är synliga
- [ ] Text är läsbar utan att behöva scrolla för mycket
- [ ] Ikoner är korrekt placerade

### CTA-sektion ("Redo att spara pengar?")
- [ ] CTA-knapp är synlig och klickbar
- [ ] Text är läsbar
- [ ] Knappen leder till korrekt sida

### Footer
- [ ] Footer är synlig
- [ ] Alla länkar är klickbara
- [ ] Sociala länkar fungerar
- [ ] Copyright-text är synlig

---

## 📤 UPLOAD-SIDA (`/upload`)

### Upload-funktionalitet
- [ ] Upload-kort är synligt och centrerat
- [ ] Drag & drop-område är tillräckligt stort för touch
- [ ] "Välj fil"-knapp är stor nog för touch
- [ ] File input öppnar korrekt (kamera eller filväljare)
- [ ] Camera-funktion fungerar på mobil
- [ ] Upload-progress visas tydligt
- [ ] Felmeddelanden visas korrekt om fil är för stor eller fel typ

### Responsivitet
- [ ] Layout fungerar i både portrait och landscape
- [ ] Text är läsbar utan zoom
- [ ] Knappar är lätta att klicka på

---

## ⚠️ BEKRÄFTELSESIDA (`/confirm`)

### Manual review
- [ ] Bekräftelsemeddelandet är synligt
- [ ] "Fortsätt ändå"-knappen fungerar
- [ ] "Tillbaka"-knappen fungerar
- [ ] Text och knappar är läsbara på mobil

---

## 📊 RESULTATSIDA (`/result`)

### Resultat-sammanfattning
- [ ] Total besparing visas tydligt
- [ ] Nuvarande kostnad vs billigaste alternativ är synligt
- [ ] Grafer/diagram är läsbara (om det finns)
- [ ] Scroll fungerar om innehållet är långt

### Extraavgifter-lista
- [ ] Lista är scrollbar om det finns många avgifter
- [ ] Varje avgift är läsbar
- [ ] Expand/kollaps fungerar (om det finns)

### Leverantörsjämförelse
- [ ] Leverantörskort är synliga
- [ ] "Byt nu"-knappar är klickbara och synliga
- [ ] Priser är läsbara
- [ ] Tooltips fungerar på touch (långtryck)

### kWh-input (om `enableConsumptionEntry` är true)
- [ ] Inputfält är synligt och pulserar med grön ram
- [ ] Inputfält är lätt att klicka på
- [ ] Tastatur öppnas korrekt (numerisk)
- [ ] Placeholder-text är synlig
- [ ] Värdet sparas när man går vidare

### Kontaktformulär
- [ ] Formulär är synligt
- [ ] Alla inputfält är klickbara
- [ ] Tastatur öppnas korrekt för varje fälttyp
- [ ] Validering fungerar (visar felmeddelanden)
- [ ] "Skicka"-knapp är klickbar
- [ ] Success/error-meddelanden visas korrekt

### Chat Widget
- [ ] Chat-widget är synlig i nedre högra hörnet
- [ ] Widget öppnar korrekt när man klickar
- [ ] Inputfält i chat fungerar
- [ ] Meddelanden skickas och visas korrekt

---

## 🔄 BYTPROCESS (`SwitchProcess` komponent)

### Steg 1: Kunduppgifter
- [ ] Alla inputfält är klickbara och synliga
- [ ] Tastatur öppnas korrekt (text, email, tel, numeric)
- [ ] Personnummer-validering fungerar
- [ ] **Kombinerad checkbox** (personuppgifter + avtalsvillkor) är synlig
- [ ] Checkbox är lätt att klicka på
- [ ] Avtalsvillkor-länk öppnas i ny flik
- [ ] "Nästa"-knapp är synlig och klickbar
- [ ] Formulär-validering fungerar

### Steg 2: Adress
- [ ] Alla adressfält är synliga
- [ ] Inputfält är klickbara
- [ ] Postnummer-input fungerar
- [ ] "Nästa"- och "Tillbaka"-knappar fungerar

### Steg 3: Nuvarande leverantör
- [ ] Leverantörsnamn-input fungerar
- [ ] Anläggnings-ID-input fungerar (18 siffror, prefix 735999)
- [ ] Datumväljare fungerar på mobil
- [ ] Validering av anläggnings-ID fungerar
- [ ] "Nästa"- och "Tillbaka"-knappar fungerar

### Steg 4: Sammanfattning
- [ ] All information är synlig och läsbar
- [ ] Scroll fungerar om innehållet är långt
- [ ] Prisinformation är läsbar
- [ ] Tooltips fungerar på touch (långtryck på Info-ikoner)
- [ ] "Bekräfta bytet"-knapp är synlig och klickbar
- [ ] Loading-state visas när order skickas

### Bekräftelsedialog (`SwitchConfirmation`)
- [ ] Dialog visas efter beställning
- [ ] Dialog passar på skärmen (max-h-[90vh])
- [ ] Scroll fungerar om innehållet är långt
- [ ] **"Stäng"-knappen är alltid synlig i botten** (viktigt!)
- [ ] E-postvarning med pulserande animation är synlig
- [ ] E-postadress är läsbar
- [ ] Referensnummer visas
- [ ] "Stäng"-knapp är klickbar och stänger dialogen

---

## 📋 KONTAKTSIDA (`/contact`)

- [ ] Formulär är synligt
- [ ] Alla fält är klickbara
- [ ] Tastatur öppnas korrekt
- [ ] Validering fungerar
- [ ] "Skicka"-knapp fungerar
- [ ] Success/error-meddelanden visas

---

## 📄 AVTALSSIDA (`/contracts`)

### kWh-input
- [ ] **Pulserande grön ram** på inputfält är synlig
- [ ] Inputfält är lätt att klicka på
- [ ] Animation fungerar smidigt
- [ ] Färgen matchar resten av sidan (mörkgrön)

### Leverantörslista
- [ ] Leverantörer visas korrekt
- [ ] Priser är läsbara
- [ ] "Byt nu"-knappar är klickbara
- [ ] SwitchProcess öppnas korrekt när man klickar

---

## ℹ️ INFORMATIONSSIDOR

### Om oss (`/about`)
- [ ] All text är läsbar
- [ ] Bilder är synliga och korrekt storlek
- [ ] Scroll fungerar
- [ ] Länkar fungerar

### FAQ (`/faq`)
- [ ] FAQ-objekt kan expanderas/kollapsas
- [ ] Touch-interaktion fungerar
- [ ] Text är läsbar när expanderad

### Integritet (`/privacy`)
- [ ] Text är läsbar
- [ ] Scroll fungerar
- [ ] Inga layout-problem

### Cookies (`/cookies`)
- [ ] Text är läsbar
- [ ] Scroll fungerar

---

## 🔧 ADMIN-PANEL (Valfritt - testa om du har åtkomst)

### Admin Dashboard (`/admin`)
- [ ] Meny fungerar (hamburger på mobil)
- [ ] Alla sidor är tillgängliga
- [ ] Statistikkort är läsbara

### Leverantörer (`/admin/providers`)
- [ ] Leverantörslista är scrollbar
- [ ] "Lägg till/Redigera"-knappar fungerar
- [ ] Formulär fungerar på mobil
- [ ] Delete-funktion fungerar

### Bytförfrågningar (`/admin/switch-requests`)
- [ ] Lista är scrollbar
- [ ] Filter-funktioner fungerar
- [ ] Status-uppdateringar fungerar
- [ ] **Delete-funktion** fungerar (enskild och bulk)
- [ ] Export till CSV fungerar
- [ ] Checkboxar för val fungerar
- [ ] Select all fungerar

---

## 🎨 DESIGN & UX

### Allmänt
- [ ] Ingen horizontal scroll
- [ ] Alla knappar är minst 44x44px (touch-vänliga)
- [ ] Tillräckligt stor spacing mellan klickbara element
- [ ] Text är läsbar utan zoom (minst 16px)
- [ ] Kontrast är tillräcklig (WCAG AA)

### Navigation
- [ ] Meny/hamburger fungerar (om det finns)
- [ ] Footer-navigation fungerar
- [ ] Breadcrumbs är läsbara (om det finns)

### Loading States
- [ ] Loading-indikatorer visas tydligt
- [ ] Ingen layout-shift när innehåll laddas

### Felhantering
- [ ] Felmeddelanden är läsbara
- [ ] Felmeddelanden är synliga (inte dolda av keyboard)

---

## ⌨️ KEYBOARD & INPUT

### Tastatur-hantering
- [ ] Numerisk keyboard öppnas för siffror (tel, number inputs)
- [ ] Email-keyboard öppnas för email-fält
- [ ] Text-keyboard öppnas för text-fält
- [ ] Inputfält scrollar upp när keyboard öppnas (ingen döljning)

### Input-validering
- [ ] Validering sker i realtid eller vid blur
- [ ] Felmeddelanden visas nära inputfältet
- [ ] Felmeddelanden är läsbara

---

## 📧 E-POST & NOTIFIKATIONER

- [ ] Orderbekräftelsemejl skickas korrekt
- [ ] E-postvarning i bekräftelsedialog är tydlig
- [ ] E-postadress visas korrekt i dialog

---

## 🔗 LÄNKAR & EXTERNA RESURSER

- [ ] Alla externa länkar öppnas i ny flik
- [ ] Interna länkar fungerar (ingen full page reload om möjligt)
- [ ] Telefonnummer-länkar fungerar (`tel:`)
- [ ] Email-länkar fungerar (`mailto:`)

---

## ⚡ PRESTANDA

- [ ] Sidor laddar snabbt (< 3 sekunder på 3G)
- [ ] Bilder är optimerade och laddar snabbt
- [ ] Ingen flickering vid laddning
- [ ] Animationer är mjuka (60fps)

---

## 🐛 VANLIGA PROBLEM ATT KONTROLLERA

### Zoom och Viewport
- [ ] Ingen oönskad zoom vid focus på input
- [ ] Viewport meta-tag är korrekt
- [ ] Text är läsbar utan manuell zoom

### Touch Targets
- [ ] Inga klickbara element är för nära varandra
- [ ] Checkboxar och radio buttons är tillräckligt stora
- [ ] Dropdown-menyer är lätta att öppna

### Layout Issues
- [ ] Ingen text overflow
- [ ] Inga bilder som bryter layouten
- [ ] Tabeller är scrollbara (om det finns)
- [ ] Modaler/dialoger passar på skärmen

### JavaScript Errors
- [ ] Inga JavaScript-fel i konsolen
- [ ] Alla funktioner fungerar även om JavaScript är långsamt

---

## 📝 TEST-PROTOKOLL

### Steg 1: Grundläggande funktionalitet
1. Gå igenom alla sidor och verifiera att de laddar
2. Testa alla huvudflöden (upload → result → switch)

### Steg 2: Formulär och input
1. Fyll i alla formulär på sidan
2. Testa validering
3. Testa submit

### Steg 3: Interaktioner
1. Testa alla knappar
2. Testa länkar
3. Testa dropdowns och modaler

### Steg 4: Edge cases
1. Testa med långa texter
2. Testa med mycket innehåll (scroll)
3. Testa med tomma fält
4. Testa med ogiltiga värden

---

## ✅ SLUTKOLL

När du gått igenom checklistan:

- [ ] Alla kritiska funktioner fungerar
- [ ] Inga blockerande buggar
- [ ] Design är konsekvent
- [ ] Användarupplevelsen är smidig
- [ ] Inga layout-problem

---

## 📞 Rapportera problem

När du hittar problem, dokumentera:
1. **Vilken sida/funktion** som har problemet
2. **Vilken enhet/webbläsare** du testar på
3. **Steg för att reproducera** problemet
4. **Screenshot** om möjligt
5. **Förväntat beteende** vs faktiskt beteende

---

**Senast uppdaterad:** 2024-01-XX  
**Version:** 1.0

