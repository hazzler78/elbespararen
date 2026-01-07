# 📊 Kunddashboard - Design & Funktioner

## Översikt

Kunddashboardet ger användare en komplett översikt över sina fakturaanalyser, besparingar och trender över tid. Det är designat för att vara både informativt och action-oriented.

---

## 🎨 Designprinciper

### Färgschema
- **Primär (Blå)**: Kostnader, huvudinformation
- **Grön**: Besparingar, positiva trender
- **Orange**: Benchmarking, jämförelser
- **Lila**: Mål och genomsnitt
- **Grå**: Sekundär information

### Layout
- **Responsiv**: Fungerar på mobil, tablet och desktop
- **Card-based**: Information organiserad i kort
- **Visual hierarchy**: Viktigaste informationen högst upp
- **Action-oriented**: Tydliga CTAs för nästa steg

---

## 📐 Dashboard-struktur

### 1. Header-sektion
```
┌─────────────────────────────────────────────────────────┐
│  Mitt Dashboard                    [Tidsperiod ▼] [📤] │
│  Översikt över dina fakturaanalyser och besparingar    │
└─────────────────────────────────────────────────────────┘
```

**Funktioner:**
- Titel och beskrivning
- Tidsperiod-väljare (månad, 3 månader, år, all tid)
- CTA-knapp: "Analysera ny faktura"

---

### 2. Key Metrics Cards (4 kort i rad)

#### A. Totalt Sparat (Grön gradient)
```
┌─────────────────────┐
│ ✨  [TrendingDown]  │
│ Totalt sparat       │
│ 1,247 kr            │
│ 8 fakturor analyserade │
└─────────────────────┘
```
- Visar summan av alla potentiella besparingar
- Antal analyserade fakturor
- Grön färg för positiv association

#### B. Nuvarande Kostnad (Blå)
```
┌─────────────────────┐
│ ⚡  [TrendingUp]    │
│ Nuvarande kostnad   │
│ 1,059 kr            │
│ per månad           │
└─────────────────────┘
```
- Senaste fakturabeloppet
- Trendindikator (upp/ner/stabil)

#### C. Genomsnittlig Besparing (Lila)
```
┌─────────────────────┐
│ 🎯                  │
│ Genomsnittlig       │
│ besparing           │
│ 156 kr              │
│ per faktura         │
└─────────────────────┘
```

#### D. Benchmark (Orange)
```
┌─────────────────────┐
│ 👥                  │
│ Jämfört med andra   │
│ 65%                 │
│ Du betalar mer än   │
│ genomsnittet        │
└─────────────────────┘
```
- Visar percentil (var användaren ligger)
- Kontextuell text baserat på position

---

### 3. Huvudinnehåll (2 kolumner)

#### Vänster: Kostnadstrend (2/3 bredd)
```
┌──────────────────────────────────────────────┐
│ Kostnadstrend          [BarChart icon]       │
│ Utveckling över tid                          │
│                                              │
│  [Bar Chart med månadsvis data]             │
│                                              │
│  ─────────────────────────────────────      │
│  ● Din kostnad  ● Genomsnitt i område       │
└──────────────────────────────────────────────┘
```

**Funktioner:**
- Visuell graf över kostnader över tid
- Jämförelse med genomsnitt i område
- Hover-tooltips med detaljer
- Interaktiv (kan klicka för mer info)

#### Höger: Nästa steg (1/3 bredd)
```
┌─────────────────────┐
│ Nästa steg          │
│                     │
│ ⚠️ Tid att byta?    │
│ [Rekommendation]    │
│ [Länk till avtal]   │
│                     │
│ 📅 Ladda upp ny     │
│ [Påminnelse]        │
│ [Länk till upload]  │
│                     │
│ 💾 Exportera data   │
│ [Export-knapp]      │
└─────────────────────┘
```

**Funktioner:**
- Kontextuella rekommendationer
- Proaktiva påminnelser
- Snabb åtkomst till viktiga funktioner

---

### 4. Senaste Analyser (Full bredd)

```
┌─────────────────────────────────────────────────────────┐
│ Senaste analyser                    [Visa alla →]       │
│ Dina fakturaanalyser över tid                           │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ✅ Jan 2025                                        │  │
│ │    425 kWh • 1,059 kr                              │  │
│ │    ↓ Potentiell besparing: 99 kr                   │  │
│ │    3 extra avgifter identifierade                  │  │
│ │                             15 jan  | 95% säker    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ✅ Dec 2024                                        │  │
│ │    480 kWh • 1,015 kr                              │  │
│ │    ↓ Potentiell besparing: 85 kr                   │  │
│ │    2 extra avgifter identifierade                  │  │
│ │                             20 dec  | 92% säker    │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Funktioner:**
- Lista över alla analyser
- Status-indikator (korrekt/behöver granskas)
- Snabb översikt: period, kWh, kostnad
- Besparingspotential
- AI-confidence badge
- Klickbar för detaljerad vy

---

## 🎯 Användarflöden

### Flöde 1: Ny användare (ingen historik)
```
Dashboard → Tomt state → "Analysera din första faktura" CTA
```

### Flöde 2: Återkommande användare
```
Dashboard → Se trender → Identifiera mönster → 
→ Ta action (byta avtal/ladda upp ny faktura)
```

### Flöde 3: Premium-användare
```
Dashboard → Se benchmarking → Jämför med andra → 
→ Exportera data → Dela med familj/ekonomiplanerare
```

---

## 📱 Responsiv design

### Mobil (< 768px)
- Metrics cards: 1 kolumn
- Trend chart: Full bredd, scrollbar
- Nästa steg: Under chart
- Senaste analyser: Full bredd, kompakt

### Tablet (768px - 1024px)
- Metrics cards: 2 kolumner
- Trend chart: 2/3 bredd
- Nästa steg: 1/3 bredd

### Desktop (> 1024px)
- Metrics cards: 4 kolumner
- Trend chart: 2/3 bredd
- Nästa steg: 1/3 bredd
- Optimal läsbarhet

---

## 🔄 Interaktivitet

### Hover-states
- Cards: Subtle shadow increase
- Chart bars: Highlight + tooltip
- Analysis items: Border color change

### Klickbara element
- Metrics cards → Detaljerad vy
- Chart bars → Specifik månadsanalys
- Analysis items → Full analysvy
- CTAs → Navigera till relevant sida

---

## 💡 Framtida förbättringar

### Fase 2
- [ ] Interaktiva grafer med Chart.js/Recharts
- [ ] Filtrering per leverantör
- [ ] Sortering av analyser
- [ ] Export-funktionalitet (PDF/Excel)

### Fase 3
- [ ] Prediktiva insikter ("Om du byter nu, sparar du X kr/år")
- [ ] Notifikationer ("Din faktura är sen")
- [ ] Social sharing ("Jag sparade X kr med Elbespararen")
- [ ] Mål-sättning ("Sätt ett besparingsmål för året")

---

## 🎨 Design tokens

```css
/* Colors */
--primary: #0052cc;
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;

/* Spacing */
--spacing-xs: 0.5rem;
--spacing-sm: 1rem;
--spacing-md: 1.5rem;
--spacing-lg: 2rem;
--spacing-xl: 3rem;

/* Border radius */
--radius-sm: 0.5rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;
```

---

## 📊 Data som behövs

### Från API
```typescript
{
  analyses: BillAnalysis[],
  stats: {
    totalAnalyses: number,
    totalSavings: number,
    averageSavings: number,
    currentMonthlyCost: number,
    lastAnalysisDate: string,
    trend: 'up' | 'down' | 'stable',
    benchmarkComparison: {
      percentile: number,
      averageInArea: number,
      yourCost: number
    }
  }
}
```

---

## ✅ Success metrics

Dashboardet är framgångsrikt om:
- Användare kommer tillbaka regelbundet
- Användare laddar upp fler fakturor efter att ha sett dashboardet
- Användare tar action (byter avtal) baserat på rekommendationer
- Användare delar dashboardet med andra
