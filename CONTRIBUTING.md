# 🤝 Contributing till Elbespararen v7

Tack för ditt intresse att bidra! Här är riktlinjer för att hålla koden konsistent och kvalitativ.

---

## 📋 Code of Conduct

- Var respektfull och professionell
- Fokusera på konstruktiv feedback
- Hjälp andra att lära och växa

---

## 🏗 Utvecklingsmiljö

### Krav

- Node.js 20+
- npm eller pnpm
- Git

### Setup

```bash
git clone https://github.com/yourusername/elbespararen_v7.git
cd elbespararen_v7
npm install
cp .env.example .env.local
# Fyll i .env.local med dina API-nycklar
npm run dev
```

---

## 🎨 Code Style

### TypeScript

- Använd TypeScript för all ny kod
- Definiera typer explicit (undvik `any`)
- Använd interfaces för objekt-strukturer

### Komponenter

- Använd functional components med hooks
- Namngiv komponenter med PascalCase
- En komponent per fil

### Filstruktur

```
components/
  ComponentName.tsx     # Komponent
  ComponentName.test.tsx # Tester (valfritt)
```

### Naming conventions

- Komponenter: `PascalCase` (t.ex. `ResultSummary.tsx`)
- Functions: `camelCase` (t.ex. `calculateSavings`)
- Constants: `UPPER_SNAKE_CASE` (t.ex. `API_URL`)
- Files: `kebab-case` för routes, `PascalCase` för komponenter

---

## 🧪 Testing

### Kör tester

```bash
npm run test       # Watch mode
npm run test:ci    # Single run
```

### Skriv tester

- Unit tests för `lib/` funktioner
- Integration tests för API-routes
- Component tests för kritiska komponenter

**Exempel:**

```typescript
describe('calculateSavings', () => {
  it('should exclude elnät from savings', () => {
    const billData = { /* ... */ };
    const savings = calculateSavings(billData);
    expect(savings.potentialSavings).toBeGreaterThanOrEqual(0);
  });
});
```

---

## 🚀 Pull Request Process

### 1. Skapa en branch

```bash
git checkout -b feature/beskrivning
# eller
git checkout -b fix/beskrivning
```

### 2. Gör dina ändringar

- Skriv tydlig, ren kod
- Följ befintliga patterns
- Lägg till/uppdatera tester om nödvändigt

### 3. Commit

Använd conventional commits:

```bash
git commit -m "feat: lägg till ny funktion"
git commit -m "fix: fixa bug i beräkning"
git commit -m "docs: uppdatera README"
git commit -m "style: formatera kod"
git commit -m "refactor: förbättra struktur"
git commit -m "test: lägg till tester"
```

### 4. Push och skapa PR

```bash
git push origin feature/beskrivning
```

Skapa sedan en Pull Request på GitHub med:
- Tydlig titel och beskrivning
- Screenshots om UI-ändringar
- Relaterade issues (om applicerbart)

---

## 🐛 Bug Reports

Använd GitHub Issues med följande info:

- **Beskrivning:** Vad är felet?
- **Steg för att reproducera:** Hur kan vi återskapa?
- **Förväntat beteende:** Vad skulle ha hänt?
- **Screenshots:** Om relevant
- **Environment:** Browser, OS, version

---

## 💡 Feature Requests

Vi uppskattar idéer! Skapa ett GitHub Issue med:

- **Problem:** Vilket problem löser featuren?
- **Lösning:** Hur skulle du implementera det?
- **Alternativ:** Andra sätt att lösa problemet?
- **Design:** Mockups eller beskrivningar (valfritt)

---

## 📦 Dependencies

### Lägg till dependency

```bash
npm install package-name
```

- Motivera varför paketet behövs
- Kontrollera att det är aktivt underhållet
- Kolla licens (ska vara MIT-kompatibel)

---

## 🔍 Code Review

All kod granskas innan merge. Vi tittar på:

- ✅ Följer code style
- ✅ Tester finns och passerar
- ✅ Dokumentation uppdaterad
- ✅ Ingen breaking changes (om inte diskuterat)
- ✅ Performance påverkan

---

## 📖 Dokumentation

Uppdatera relevant dokumentation:

- `README.md` – Översikt och snabbstart
- `DEPLOYMENT.md` – Deploy-instruktioner
- `CONTRIBUTING.md` – Denna fil
- JSDoc-kommentarer för publika funktioner

---

## 🙏 Tack!

Varje bidrag, stort som litet, uppskattas enormt! Tillsammans gör vi elmarknaden mer transparent. ⚡️

