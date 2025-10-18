# 🚀 Deployment Guide – Elbespararen v7

Guide för att deploya Elbespararen till produktion.

---

## 📋 Pre-deployment checklist

- [ ] OpenAI API-nyckel konfigurerad
- [ ] Telegram Bot setup (valfritt)
- [ ] Databas konfigurerad (valfritt)
- [ ] Miljövariabler testade lokalt
- [ ] Build fungerar utan fel
- [ ] Linter errors fixade
- [ ] Tester körs utan fel
- [ ] Mobiltestat på iOS + Android
- [ ] `.env.example` uppdaterad

---

## 🌐 Deploy till Vercel (Rekommenderat)

### 1. Skapa Vercel-projekt

```bash
npm install -g vercel
vercel login
vercel
```

### 2. Konfigurera miljövariabler

Gå till Vercel Dashboard → Project → Settings → Environment Variables

Lägg till:
- `OPENAI_API_KEY`
- `TELEGRAM_BOT_TOKEN` (valfritt)
- `TELEGRAM_CHAT_ID` (valfritt)
- `DATABASE_URL` (valfritt)
- `NEXT_PUBLIC_APP_URL` (t.ex. https://elbespararen.se)

### 3. Deploy

```bash
vercel --prod
```

### 4. Konfigurera custom domain (valfritt)

Gå till Vercel Dashboard → Project → Settings → Domains

---

## 🐳 Deploy med Docker

### 1. Skapa Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### 2. Bygg och kör

```bash
docker build -t elbespararen .
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e TELEGRAM_BOT_TOKEN=your_token \
  elbespararen
```

---

## 🗄️ Databas-setup (Valfritt)

För att spara leads permanent, koppla upp en PostgreSQL-databas.

### Option 1: Supabase

1. Skapa projekt på [supabase.com](https://supabase.com)
2. Hämta `DATABASE_URL` från Settings → Database
3. Kör migrations (skapa tabeller):

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  bill_data JSONB NOT NULL,
  savings JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

### Option 2: Railway/Render/Neon

Liknande process – skapa databas, hämta connection string, sätt miljövariabel.

---

## 📱 Telegram Bot Setup

### 1. Skapa bot

1. Chatta med [@BotFather](https://t.me/BotFather) på Telegram
2. Skicka `/newbot` och följ instruktioner
3. Spara `TELEGRAM_BOT_TOKEN`

### 2. Hämta chat ID

1. Starta en chatt med din bot
2. Besök: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Hitta `"chat":{"id":123456789}` i JSON
4. Spara `TELEGRAM_CHAT_ID`

---

## 🔐 Säkerhet

### Rate limiting

Lägg till rate limiting för API-routes:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m")
});
```

### CORS

Om du ska anropa API:n från andra domäner, konfigurera CORS i `next.config.ts`.

---

## 📊 Analytics (Valfritt)

### Plausible Analytics

```bash
npm install next-plausible
```

```tsx
// src/app/layout.tsx
import PlausibleProvider from 'next-plausible'

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <head>
        <PlausibleProvider domain="elbespararen.se" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

## 🐛 Monitoring

### Sentry

```bash
npm install @sentry/nextjs
```

```bash
npx @sentry/wizard@latest -i nextjs
```

---

## 📈 Performance

### Next.js optimeringar

- ✅ Image optimization (använd `next/image`)
- ✅ Font optimization (använd `next/font`)
- ✅ Code splitting (automatiskt)
- ✅ Server Components (default i App Router)

### Lighthouse checklist

- [ ] Performance > 90
- [ ] Accessibility > 95
- [ ] Best Practices > 90
- [ ] SEO > 95

---

## 🔄 CI/CD

### GitHub Actions

Skapa `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test:ci
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📞 Support

Om problem uppstår, kontrollera:

1. Miljövariabler är korrekt satta
2. OpenAI API-nyckel har credit
3. Build logs för fel
4. Browser console för frontend-fel

---

**Lycka till med deployeringen! 🚀**

