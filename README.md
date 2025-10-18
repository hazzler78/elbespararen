# Elbespararen v7

En Next.js-applikation som analyserar elräkningar med OpenAI Vision för att identifiera dolda avgifter och beräkna potentiella besparingar.

## 🚀 Funktioner

- **AI-driven analys** av elräkningar med GPT-4o Vision
- **Automatisk identifiering** av extra avgifter och dolda kostnader
- **Besparingsberäkning** baserat på spotpris och billigare alternativ
- **Leverantörsjämförelse** med databas över elleverantörer
- **Bytprocess** för kunder som vill byta leverantör
- **Admin-gränssnitt** för att hantera leverantörer och bytförfrågningar
- **Cloudflare D1** databas för produktion
- **Responsiv design** optimerad för mobil

## 🛠️ Teknisk stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **AI:** OpenAI GPT-4o Vision med structured output
- **Databas:** Cloudflare D1 (SQLite) med migrations
- **Deployment:** Cloudflare Pages
- **Styling:** Tailwind CSS + Framer Motion
- **Testing:** Jest + Testing Library

## 📋 Förutsättningar

- Node.js 18+ 
- npm eller yarn
- OpenAI API-nyckel
- Cloudflare-konto (för produktion)

## 🚀 Snabbstart

### 1. Klona repository

```bash
git clone https://github.com/hazzler78/elbespararen.git
cd elbespararen
```

### 2. Installera dependencies

```bash
npm install
```

### 3. Konfigurera miljövariabler

```bash
cp env.example .env.local
```

Redigera `.env.local` och lägg till din OpenAI API-nyckel:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Starta utvecklingsserver

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## 🗄️ Databas

### Utveckling
Applikationen använder mock data under utveckling. Inga databas-installationer krävs.

### Produktion med Cloudflare D1

1. **Skapa D1-databas:**
```bash
npm run db:create
```

2. **Kör migrations:**
```bash
npm run db:migrate
```

3. **Seed data (valfritt):**
```bash
npm run db:seed
```

## 🚀 Deployment till Cloudflare

### 1. Installera Wrangler

```bash
npm install -g wrangler
```

### 2. Logga in på Cloudflare

```bash
wrangler login
```

### 3. Konfigurera wrangler.toml

Uppdatera `wrangler.toml` med ditt Cloudflare Account ID och Database ID.

### 4. Deploy

```bash
npm run deploy
```

## 📁 Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── admin/             # Admin-gränssnitt
│   ├── upload/            # Fakturauppladdning
│   └── result/            # Analysresultat
├── components/            # React-komponenter
├── lib/                   # Utilities och konfiguration
│   ├── database/          # Databas-abstraktion
│   └── __tests__/         # Tester
└── types.ts              # TypeScript-typer
```

## 🧪 Testing

```bash
# Kör alla tester
npm test

# Kör tester en gång (för CI)
npm run test:ci
```

## 📊 API Endpoints

- `POST /api/parse-bill-v3` - Analysera elräkning med AI
- `GET /api/providers` - Hämta elleverantörer
- `POST /api/providers/compare` - Jämför leverantörer
- `POST /api/switch-requests` - Skapa bytförfrågan
- `GET /api/switch-requests` - Hämta bytförfrågningar

## 🔧 Konfiguration

### Miljövariabler

Se `env.example` för alla tillgängliga miljövariabler.

### OpenAI-konfiguration

Applikationen använder GPT-4o för bästa vision-prestanda. Konfigurera i `src/lib/constants.ts`:

```typescript
export const OPENAI_CONFIG = {
  model: "gpt-4o",
  temperature: 0,
  maxTokens: 2000
} as const;
```

## 🎯 Användning

1. **Ladda upp elräkning** - Användaren laddar upp en bild av sin elräkning
2. **AI-analys** - GPT-4o analyserar fakturan och extraherar data
3. **Besparingsberäkning** - Systemet beräknar potentiella besparingar
4. **Leverantörsjämförelse** - Visa billigare alternativ
5. **Bytprocess** - Kunder kan begära att byta leverantör

## 🔒 Säkerhet

- Alla API-nycklar lagras som miljövariabler
- GDPR-kompatibel databehandling
- Validering av alla användarinputs
- Säker filuppladdning med typvalidering

## 📈 Prestanda

- **Turbopack** för snabb utveckling
- **Cloudflare CDN** för global distribution
- **D1 Edge Database** för låg latens
- **Optimized images** med Next.js Image

## 🤝 Bidrag

1. Forka repository
2. Skapa feature branch (`git checkout -b feature/amazing-feature`)
3. Commita ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branch (`git push origin feature/amazing-feature`)
5. Öppna Pull Request

## 📄 Licens

Detta projekt är licensierat under MIT License - se [LICENSE](LICENSE) filen för detaljer.

## 🆘 Support

För support eller frågor:
- Skapa en [Issue](https://github.com/hazzler78/elbespararen/issues)
- Kontakta utvecklaren

## 🗺️ Roadmap

- [ ] E-postnotifikationer
- [ ] Telegram-bot integration
- [ ] Avancerad analytics
- [ ] Multi-språk support
- [ ] Mobile app
- [ ] API för tredjepartsintegration

---

**Elbespararen v7** - Gör det enkelt att spara pengar på elräkningen! ⚡💰