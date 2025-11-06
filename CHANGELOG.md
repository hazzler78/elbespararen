# 📝 Changelog – Elbespararen

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [7.0.0] - 2025-10-17

### ✨ Added

- **AI Vision parsing** – OpenAI GPT-4o-mini läser fakturor visuellt
- **Strukturerad output** – JSON Schema för konsistent parsing
- **Confidence scoring** – Säkerhetspoäng för varje avgift och analys
- **Besparingsberäkning** – Jämför mot spotpris + minimal avgift
- **Mobilanpassad design** – 8px grid, luftig layout
- **Extra avgiftslista** – Detaljerad breakdown av alla onödiga extra kostnader
- **Confirm-sida** – Manuell verifiering vid låg confidence
- **Telegram-notiser** – Real-time leads direkt till Telegram
- **Admin dashboard** – Översikt över leads och statistik
- **Contact form** – Lead-generering med validering
- **Sticky CTA** – Konverteringsoptimerad bottom bar
- **Testing setup** – Jest + Testing Library
- **TypeScript** – Full type-safety genom hela appen
- **Framer Motion** – Smooth animations och transitions

### 🎨 Design

- Färgpalett: Skatteverket möter Klarna (blå, grön, orange)
- Minimalistisk UI utan glas-effekter
- Förtroendeingivande layout
- Tydlig informationshierarki
- Accessibility-fokus med keyboard navigation

### 📚 Documentation

- README med setup-instruktioner
- DEPLOYMENT.md med deploy-guide
- CONTRIBUTING.md med dev-guidelines
- Inline JSDoc-kommentarer
- API-dokumentation

### 🔧 Technical

- Next.js 14 App Router
- Tailwind CSS v4 med inline config
- OpenAI SDK v6
- Structured JSON output
- SessionStorage för bill data
- Print-vänlig result-sida

---

## [6.0.0] - Previous Version

(Tidigare versioner använde Tesseract OCR istället för Vision AI)

---

## Future Roadmap

### v7.1 – Database & Persistence
- [ ] PostgreSQL/Supabase integration
- [ ] Lead CRUD operations
- [ ] Status tracking
- [ ] Export till CSV

### v7.2 – Enhanced Features
- [ ] AI Chat för elråd
- [ ] Jämför flera fakturor
- [ ] Historisk data & tracking
- [ ] Email-notiser

### v7.3 – Analytics & Optimization
- [ ] Plausible Analytics
- [ ] A/B testing
- [ ] SEO optimering
- [ ] Performance monitoring

---

**Version 7.0** markerar en komplett omskrivning med fokus på AI-precision, design och användarvänlighet. 🚀

