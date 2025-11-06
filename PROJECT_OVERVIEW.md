# 📊 Elbespararen v7 – Projektöversikt

En komplett översikt över projektets struktur, arkitektur och implementation.

---

## 🎯 Projektmål

Skapa en AI-driven Next.js-app som:
1. **Analyserar** svenska elräkningar visuellt med OpenAI Vision
2. **Hittar** alla onödiga extra avgifter och kostnader
3. **Beräknar** potentiella besparingar mot spotpris
4. **Konverterar** besökare till leads via kontaktformulär
5. **Ger** en förtroendeingivande, transparent användarupplevelse

---

## 🏗 Arkitektur

### Stack
```
Frontend:  Next.js 14 (App Router) + React 19
Styling:   Tailwind CSS v4 (inline config)
Animation: Framer Motion
Icons:     Lucide React
AI:        OpenAI GPT-4o-mini (Vision + Structured Output)
Language:  TypeScript (strict mode)
Testing:   Jest + Testing Library
```

### Data Flow
```
1. User uploads bill (JPEG/PNG/WebP/PDF)
   ↓
2. POST /api/parse-bill-v3
   ↓ 
3. OpenAI Vision analyzes image
   ↓
4. Returns structured JSON (BillData)
   ↓
5. Calculate savings (lib/calculations.ts)
   ↓
6. Show results + extra fees
   ↓
7. User fills contact form
   ↓
8. POST /api/leads → Telegram notification
```

---

## 📁 Filstruktur (detaljerad)

```
elbespararen_v9/
│
├── src/app/                    # Next.js App Router
│   ├── page.tsx               # 🏠 Startsida (hero, benefits, CTA)
│   ├── layout.tsx             # Root layout med metadata
│   ├── globals.css            # Tailwind + custom CSS vars
│   │
│   ├── upload/                # 📤 Upload-flöde
│   │   └── page.tsx           # Upload-sida med UploadCard
│   │
│   ├── confirm/               # ✅ Bekräftelse (låg confidence)
│   │   └── page.tsx           # Manual review-sida
│   │
│   ├── result/                # 📊 Resultat-sida
│   │   └── page.tsx           # Savings + fees + CTA
│   │
│   ├── admin/                 # 🔧 Admin dashboard
│   │   └── page.tsx           # Leads overview + stats
│   │
│   └── api/                   # API Routes
│       ├── parse-bill-v3/     # Vision parsing
│       │   └── route.ts       # POST: Analyze bill with Vision
│       ├── leads/             # Lead management
│       │   └── route.ts       # GET/POST: CRUD operations
│       └── chat/              # AI chat helper
│           └── route.ts       # POST: Ask questions about bills
│
├── components/                # React komponenter
│   ├── UploadCard.tsx        # Drag-drop upload + preview
│   ├── ResultSummary.tsx     # Huvudresultat med besparingar
│   ├── ExtraFeesList.tsx     # Lista över onödiga extra avgifter
│   ├── ConfidenceBadge.tsx   # Säkerhetsindikator (färgkodad)
│   ├── ContactForm.tsx       # Lead-formulär
│   └── StickyCTA.tsx         # Sticky bottom CTA bar
│
├── lib/                       # Utilities & core logic
│   ├── types.ts              # TypeScript interfaces/types
│   ├── schema.ts             # OpenAI JSON Schema definition
│   ├── calculations.ts       # Savings logic (core business logic)
│   ├── constants.ts          # Config, prompts, enums
│   ├── utils.ts              # Helper functions
│   └── __tests__/            # Unit tests
│       └── calculations.test.ts
│
├── scripts/                   # Build & dev scripts
│   └── verify-setup.js       # Setup verification script
│
├── public/                    # Static assets
│   └── *.svg                 # Icons & images
│
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript config
├── jest.config.js            # Jest testing config
├── jest.setup.js             # Jest setup file
│
└── Documentation/
    ├── README.md             # Main documentation
    ├── DEPLOYMENT.md         # Deploy guide
    ├── CONTRIBUTING.md       # Contribution guidelines
    ├── CHANGELOG.md          # Version history
    └── PROJECT_OVERVIEW.md   # This file
```

---

## 🧠 Core Logic

### 1. Vision Parsing (`src/app/api/parse-bill-v3/route.ts`)

**Input:** Image/PDF file (max 10MB)
**Process:**
1. Convert to Base64
2. Send to OpenAI Vision with system prompt
3. Get structured JSON response (via JSON Schema)
4. Validate and return BillData

**Output:**
```typescript
{
  elnatCost: 450,
  elhandelCost: 620,
  extraFeesTotal: 98,
  extraFeesDetailed: [
    { label: "Påslag", amount: 49, confidence: 0.95 },
    { label: "Årsavgift", amount: 49, confidence: 0.92 }
  ],
  totalKWh: 400,
  period: "Jan 2025",
  contractType: "rörligt",
  confidence: 0.93
}
```

### 2. Savings Calculation (`lib/calculations.ts`)

**Logik:**
```
currentCost = elnät + elhandel + extraFees
cheapestElhandel = (kWh × 0.50 kr) + 29 kr  // Spotpris + minimal avgift
cheapestAlternative = elnät + cheapestElhandel
potentialSavings = currentCost - cheapestAlternative
```

**Viktigt:** Elnät är **ALDRIG** inkluderat i besparing (ej påverkbart).

### 3. Confidence Scoring

- **High (≥90%):** Grön badge, direkt till result
- **Medium (70-89%):** Gul badge, direkt till result
- **Low (<70%):** Röd badge, via confirm-sida först

---

## 🎨 Design System

### Färgpalett
```css
Primary:   #0052cc  (Blå - förtroende, CTA)
Secondary: #00875a  (Grön - besparing)
Accent:    #ff991f  (Orange - varning)
Success:   #10b981  (Grön - validering)
Warning:   #f59e0b  (Gul - medium confidence)
Error:     #ef4444  (Röd - fel, low confidence)
```

### Spacing (8px grid)
```
8px   → 0.5 rem (tight)
16px  → 1 rem (normal)
24px  → 1.5 rem (comfortable)
32px  → 2 rem (section)
48px  → 3 rem (large section)
```

### Typography
```
H1: 3rem (48px) / font-bold
H2: 2rem (32px) / font-bold
H3: 1.5rem (24px) / font-semibold
Body: 1rem (16px) / font-normal
Small: 0.875rem (14px) / font-normal
```

---

## 🔌 API Endpoints

### `POST /api/parse-bill-v3`
**Purpose:** Analyze electricity bill with Vision AI

**Request:**
```bash
Content-Type: multipart/form-data
Body: file (image/jpeg, image/png, image/webp, application/pdf)
```

**Response:**
```json
{
  "success": true,
  "data": { ...BillData },
  "meta": {
    "fileName": "faktura.jpg",
    "fileSize": 123456,
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### `POST /api/leads`
**Purpose:** Create new lead and send notification

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "070-123 45 67",
  "billData": { ...BillData },
  "savings": { ...SavingsCalculation }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ...Lead }
}
```

### `GET /api/leads`
**Purpose:** Get all leads (admin)

**Response:**
```json
{
  "success": true,
  "data": [...leads],
  "count": 42
}
```

### `POST /api/chat`
**Purpose:** AI chat helper for electricity questions

**Request:**
```json
{
  "message": "Vad är spotpris?",
  "context": { ...BillData } // optional
}
```

**Response:**
```json
{
  "success": true,
  "reply": "Spotpris är elpriset som varierar per timme..."
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- `lib/calculations.ts` – All calculation logic
- `lib/utils.ts` – Helper functions
- `lib/schema.ts` – Schema validation

### Integration Tests (TODO)
- API routes
- Database operations
- External API calls

### E2E Tests (TODO)
- Upload flow
- Result display
- Contact form submission

**Run tests:**
```bash
npm run test      # Watch mode
npm run test:ci   # Single run (for CI/CD)
```

---

## 📦 Dependencies

### Production
```json
{
  "next": "15.5.6",           // Framework
  "react": "19.1.0",          // UI library
  "openai": "^6.4.0",         // AI Vision API
  "framer-motion": "^12.23",  // Animations
  "lucide-react": "^0.546"    // Icons
}
```

### Development
```json
{
  "typescript": "^5",         // Type safety
  "tailwindcss": "^4",        // Styling
  "jest": "latest",           // Testing
  "@testing-library/*": "*"   // Component testing
}
```

---

## 🚀 Deployment Checklist

- [ ] `.env.local` configured with OPENAI_API_KEY
- [ ] Telegram bot setup (optional)
- [ ] Database connected (optional)
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm run test:ci`
- [ ] Linter clean: `npm run lint`
- [ ] Mobile tested (iOS + Android)
- [ ] Desktop tested (Chrome, Safari, Firefox)
- [ ] Performance > 90 (Lighthouse)
- [ ] Accessibility > 95 (Lighthouse)

---

## 🔮 Future Enhancements

### v7.1 – Database & Persistence
- Supabase/PostgreSQL integration
- Lead management dashboard
- User authentication (optional)

### v7.2 – Enhanced Features
- Multi-bill comparison
- Historical tracking
- Email notifications
- PDF export

### v7.3 – Analytics & Optimization
- Plausible/Google Analytics
- A/B testing framework
- SEO optimization
- Performance monitoring (Sentry)

### v7.4 – Advanced AI
- Multi-language support (English, Norwegian, Danish)
- Voice input for accessibility
- Predictive pricing models
- Personalized recommendations

---

## 📞 Support & Troubleshooting

### Common Issues

**1. "OpenAI API key not found"**
- Check `.env.local` exists
- Verify `OPENAI_API_KEY` is set correctly
- Restart dev server

**2. "Module not found"**
- Run `npm install`
- Clear `.next/` cache: `rm -rf .next`

**3. "Vision parsing fails"**
- Check file size < 10MB
- Verify file type is supported
- Check OpenAI API credit

**4. Tailwind styles not working**
- Check `globals.css` imports Tailwind
- Verify Tailwind v4 config in CSS file
- Restart dev server

---

## 🙏 Credits

**Built with:**
- Next.js by Vercel
- OpenAI Vision API
- Tailwind CSS
- Framer Motion
- Lucide Icons

**Inspired by:**
- Skatteverket (trust & clarity)
- Klarna (modern, friendly UX)
- Swedish design principles (minimalism, functionality)

---

**Elbespararen v7** – Making electricity pricing transparent, one bill at a time. ⚡️

