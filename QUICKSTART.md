# ⚡️ Quickstart Guide – Elbespararen v7

Kom igång på 5 minuter!

---

## 📋 Förutsättningar

- Node.js 20+ installerat
- OpenAI API-nyckel ([skaffa här](https://platform.openai.com/api-keys))
- Terminal/PowerShell

---

## 🚀 Steg 1: Installation

```bash
# Klona eller navigera till projektet
cd elbespararen_v9

# Installera dependencies
npm install
```

---

## 🔐 Steg 2: Konfigurera miljövariabler

Skapa `.env.local` från mallen:

**PowerShell:**
```powershell
Copy-Item .env.example .env.local
```

**Bash:**
```bash
cp .env.example .env.local
```

Öppna `.env.local` och lägg till din OpenAI API-nyckel:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

> **Tips:** Telegram Bot är valfritt för lokal utveckling. Hoppa över det för nu.

---

## ✅ Steg 3: Verifiera setup

```bash
npm run verify
```

Du ska se:
```
✓ package.json
✓ tsconfig.json
✓ All components
✓ All API routes
✓ Dependencies
...
✅ Allt ser bra ut!
```

---

## 🎯 Steg 4: Starta utvecklingsserver

```bash
npm run dev
```

Öppna: [http://localhost:3000](http://localhost:3000)

---

## 📸 Steg 5: Testa appen

### 1. Startsida
- Se hero-sektionen
- Klicka "Analysera min faktura"

### 2. Upload-sida
- Ladda upp en bild eller PDF av en elfaktura
- Vänta 5-10 sekunder medan AI analyserar

### 3. Resultat-sida
- Se potentiella besparingar
- Kolla onödiga extra avgifter
- Testa kontaktformuläret (data sparas ej än)

### 4. Admin-sida
- Gå till `/admin` för att se dashboard
- (Tom tills databas är kopplad)

---

## 🧪 Kör tester (valfritt)

```bash
npm run test:ci
```

---

## 🎨 Customisera design

### Ändra färger

Redigera `src/app/globals.css`:

```css
:root {
  --primary: #0052cc;     /* Din primärfärg */
  --secondary: #00875a;   /* Besparingsfärg */
  --accent: #ff991f;      /* Accentfärg */
}
```

### Ändra spotpris-antagande

Redigera `lib/calculations.ts`:

```typescript
const estimatedSpotPrice = 0.50; // Ändra till önskat pris/kWh
const minimalMonthlyFee = 29;    // Ändra till önskad månadskostnad
```

---

## 🐛 Troubleshooting

### Problem: "Failed to fetch"
**Lösning:** Kontrollera att dev-servern kör och att du har internet.

### Problem: "OpenAI API key not found"
**Lösning:** Verifiera att `.env.local` finns och innehåller korrekt nyckel. Starta om servern.

### Problem: Tailwind-styles laddas inte
**Lösning:** Stoppa servern (Ctrl+C), radera `.next` mappen, starta om:
```bash
rm -rf .next
npm run dev
```

### Problem: "Module not found"
**Lösning:** Installera om dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Nästa steg

1. **Läs dokumentationen:** `README.md`, `PROJECT_OVERVIEW.md`
2. **Utforska koden:** Börja med `src/app/page.tsx` och komponenter
3. **Testa API:n:** Använd Postman eller curl för att testa endpoints
4. **Bygg något eget:** Skapa nya komponenter eller features
5. **Bidra:** Se `CONTRIBUTING.md` för guidelines

---

## 🎓 Lär dig mer

### Key Files att utforska

1. `lib/calculations.ts` – Besparingslogiken
2. `lib/schema.ts` – OpenAI JSON Schema
3. `src/app/api/parse-bill-v3/route.ts` – Vision parsing
4. `components/ResultSummary.tsx` – Resultat-UI
5. `src/app/globals.css` – Design-system

### Resurser

- [Next.js Docs](https://nextjs.org/docs)
- [OpenAI Vision Guide](https://platform.openai.com/docs/guides/vision)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

---

## 🤝 Behöver hjälp?

- 📖 Läs `README.md` för mer detaljer
- 💬 Öppna ett GitHub Issue
- 📧 Kontakta projektet

---

**Lycka till! ⚡️ Bygg något fantastiskt.**

