# 🎨 Dashboard - Visuell Mockup

## Översikt
Detta dokument beskriver hur dashboardet ser ut visuellt, med fokus på layout, färger och användarupplevelse.

---

## 🖼️ Full Screen Mockup

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  [Header - Vit bakgrund]                                                    ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │  Mitt Dashboard                    [Senaste året ▼] [📤 Analysera]│    ║
║  │  Översikt över dina fakturaanalyser och besparingar                │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [Main Content - Grå bakgrund #F9FAFB]                                      ║
║                                                                              ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      ║
║  │  ✨          │ │  ⚡          │ │  🎯          │ │  👥          │      ║
║  │  Totalt      │ │  Nuvarande   │ │  Genomsnitt  │ │  Benchmark   │      ║
║  │  sparat      │ │  kostnad     │ │  besparing   │ │              │      ║
║  │              │ │              │ │              │ │              │      ║
║  │  1,247 kr    │ │  1,059 kr    │ │  156 kr      │ │  65%         │      ║
║  │              │ │              │ │              │ │              │      ║
║  │  8 fakturor  │ │  per månad   │ │  per faktura │ │  Du betalar  │      ║
║  │              │ │              │ │              │ │  mer än       │      ║
║  │  [Grön]      │ │  [Blå]       │ │  [Lila]      │ │  genomsnitt  │      ║
║  │              │ │              │ │              │ │  [Orange]    │      ║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      ║
║                                                                              ║
║  ┌──────────────────────────────────────────┐ ┌──────────────────────┐   ║
║  │  Kostnadstrend              [📊]        │ │  Nästa steg          │   ║
║  │  Utveckling över tid                     │ │                      │   ║
║  │                                          │ │  ⚠️ Tid att byta?    │   ║
║  │  ▁▃▅▇█▆▄▂                                │ │  Du betalar 1,059 kr │   ║
║  │  ▁▃▅▇█▆▄▂                                │ │  Genomsnitt: 920 kr  │   ║
║  │                                          │ │  [Se bättre avtal →] │   ║
║  │  Jan Feb Mar Apr May Jun                 │ │                      │   ║
║  │                                          │ │  📅 Ladda upp ny     │   ║
║  │  ─────────────────────────────────────   │ │  Senaste: 15 jan     │   ║
║  │  ● Din kostnad  ● Genomsnitt            │ │  [Analysera nu →]    │   ║
║  └──────────────────────────────────────────┘ │                      │   ║
║                                                │  💾 Exportera data   │   ║
║                                                │  [Exportera →]        │   ║
║                                                └──────────────────────┘   ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │  Senaste analyser                              [Visa alla →]       │    ║
║  │  Dina fakturaanalyser över tid                                      │    ║
║  │                                                                      │    ║
║  │  ┌──────────────────────────────────────────────────────────────┐   │    ║
║  │  │ ✅  Jan 2025                                                │   │    ║
║  │  │     425 kWh • 1,059 kr                                       │   │    ║
║  │  │     ↓ Potentiell besparing: 99 kr                           │   │    ║
║  │  │     3 extra avgifter identifierade                         │   │    ║
║  │  │                                   15 jan  | 95% säker        │   │    ║
║  │  └──────────────────────────────────────────────────────────────┘   │    ║
║  │                                                                      │    ║
║  │  ┌──────────────────────────────────────────────────────────────┐   │    ║
║  │  │ ✅  Dec 2024                                                │   │    ║
║  │  │     480 kWh • 1,015 kr                                       │   │    ║
║  │  │     ↓ Potentiell besparing: 85 kr                           │   │    ║
║  │  │     2 extra avgifter identifierade                          │   │    ║
║  │  │                                   20 dec  | 92% säker        │   │    ║
║  │  └──────────────────────────────────────────────────────────────┘   │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎨 Färgpalett & Visuella Element

### Metrics Cards

#### 1. Totalt Sparat (Grön)
```
┌─────────────────────────┐
│ ┌───┐                   │
│ │ ✨│  [TrendingDown ↓] │
│ └───┘                   │
│                         │
│ Totalt sparat           │
│ 1,247 kr                │
│                         │
│ 8 fakturor analyserade   │
└─────────────────────────┘

Bakgrund: Gradient från #D1FAE5 till #A7F3D0
Border: #10B981
Icon bakgrund: #10B981
Text: #065F46 (mörk grön)
```

#### 2. Nuvarande Kostnad (Blå)
```
┌─────────────────────────┐
│ ┌───┐                   │
│ │ ⚡│  [TrendingUp ↑]    │
│ └───┘                   │
│                         │
│ Nuvarande kostnad       │
│ 1,059 kr                │
│                         │
│ per månad               │
└─────────────────────────┘

Bakgrund: Vit (#FFFFFF)
Border: #E5E7EB
Icon bakgrund: #3B82F6
Text: #1F2937
```

#### 3. Genomsnittlig Besparing (Lila)
```
┌─────────────────────────┐
│ ┌───┐                   │
│ │ 🎯│                   │
│ └───┘                   │
│                         │
│ Genomsnittlig besparing │
│ 156 kr                  │
│                         │
│ per faktura            │
└─────────────────────────┘

Bakgrund: Vit (#FFFFFF)
Border: #E5E7EB
Icon bakgrund: #8B5CF6
Text: #1F2937
```

#### 4. Benchmark (Orange)
```
┌─────────────────────────┐
│ ┌───┐                   │
│ │ 👥│                   │
│ └───┘                   │
│                         │
│ Jämfört med andra       │
│ 65%                     │
│                         │
│ Du betalar mer än       │
│ genomsnittet            │
└─────────────────────────┘

Bakgrund: Vit (#FFFFFF)
Border: #E5E7EB
Icon bakgrund: #F59E0B
Text: #1F2937
```

---

## 📊 Chart Design

### Kostnadstrend Grafen

```
┌─────────────────────────────────────────────┐
│ Kostnadstrend              [BarChart icon] │
│ Utveckling över tid                         │
│                                             │
│                                             │
│     ▁▃▅▇█▆▄▂                               │
│     ▁▃▅▇█▆▄▂                               │
│                                             │
│     Jan Feb Mar Apr May Jun                 │
│                                             │
│ ─────────────────────────────────────────  │
│ ● Din kostnad  ● Genomsnitt i område       │
└─────────────────────────────────────────────┘

Bar Chart:
- Blå bars (#3B82F6) för användarens kostnad
- Grön linje (#10B981) för genomsnitt
- Hover: Mörkare nyans + tooltip med exakta värden
- Höjd: 256px (h-64)
```

---

## 🎯 "Nästa steg" Kort

### Rekommendation Card (Blå)
```
┌─────────────────────────────┐
│ ⚠️  Tid att byta avtal?     │
│                             │
│ Du betalar 1,059 kr/månad. │
│ Genomsnittet i ditt område │
│ är 920 kr.                  │
│                             │
│ [Se bättre avtal →]         │
└─────────────────────────────┘

Bakgrund: #DBEAFE (ljusblå)
Border: #93C5FD
Icon: #2563EB
Text: #1E40AF
```

### Påminnelse Card (Grön)
```
┌─────────────────────────────┐
│ 📅  Ladda upp ny faktura    │
│                             │
│ Din senaste analys är från │
│ 15 januari.                 │
│                             │
│ [Analysera nu →]            │
└─────────────────────────────┘

Bakgrund: #D1FAE5 (ljusgrön)
Border: #6EE7B7
Icon: #10B981
Text: #065F46
```

### Export Card (Grå)
```
┌─────────────────────────────┐
│ 💾  Exportera data          │
│                             │
│ Ladda ner alla dina analyser│
│ som PDF eller Excel.        │
│                             │
│ [Exportera →]               │
└─────────────────────────────┘

Bakgrund: #F3F4F6
Border: #D1D5DB
Icon: #6B7280
Text: #374151
```

---

## 📋 Analysis List Items

### Analysis Card Design
```
┌─────────────────────────────────────────────────────────┐
│ ✅  Jan 2025                                            │
│     425 kWh • 1,059 kr                                  │
│     ↓ Potentiell besparing: 99 kr                       │
│     3 extra avgifter identifierade                      │
│                                   15 jan  | 95% säker   │
└─────────────────────────────────────────────────────────┘

Layout:
- Status icon (✅/⚠️) i färgad cirkel
- Period som rubrik
- kWh och kostnad på samma rad
- Besparingsindikator med pil nedåt (grön)
- Antal avgifter
- Datum och confidence badge till höger

Hover State:
- Border blir blå (#0052cc)
- Shadow ökar
- Cursor: pointer
```

### Confidence Badges
```
95% säker → Grön bakgrund (#D1FAE5), grön text (#065F46)
70-89%    → Gul bakgrund (#FEF3C7), gul text (#92400E)
<70%      → Röd bakgrund (#FEE2E2), röd text (#991B1B)
```

---

## 📱 Mobil Layout

### Metrics Cards (Mobil)
```
┌─────────────────┐
│ ✨ Totalt sparat│
│ 1,247 kr        │
│ 8 fakturor      │
└─────────────────┘

┌─────────────────┐
│ ⚡ Nuvarande    │
│ 1,059 kr        │
│ per månad       │
└─────────────────┘

┌─────────────────┐
│ 🎯 Genomsnitt  │
│ 156 kr          │
│ per faktura    │
└─────────────────┘

┌─────────────────┐
│ 👥 Benchmark    │
│ 65%             │
│ Mer än genomsnitt│
└─────────────────┘

[1 kolumn, full bredd]
```

### Chart (Mobil)
```
┌─────────────────────────┐
│ Kostnadstrend           │
│                         │
│ [Scrollbar för graf]    │
│                         │
│ Jan Feb Mar Apr...      │
└─────────────────────────┘

[Full bredd, scrollbar om många månader]
```

---

## ✨ Interaktiva Element

### Hover States

**Metrics Cards:**
```
Normal:  shadow-sm
Hover:   shadow-md + scale(1.02)
```

**Chart Bars:**
```
Normal:  opacity 100%
Hover:   opacity 80% + darker shade + tooltip
```

**Analysis Items:**
```
Normal:  border-gray-200
Hover:   border-primary + shadow-md
```

### Loading States

```
┌─────────────────────────┐
│     [Spinner]           │
│                         │
│  Laddar dashboard...    │
└─────────────────────────┘

Spinner: Animerad cirkel, primär färg
Text: Grå (#6B7280)
```

### Empty States

```
┌─────────────────────────┐
│    [FileText icon]      │
│                         │
│  Inga analyser ännu    │
│                         │
│  [Analysera första →]   │
└─────────────────────────┘

Icon: Stor, grå (#D1D5DB)
Text: Centrerad, grå (#6B7280)
CTA: Primär knapp
```

---

## 🎭 Animationer

### Page Load
- Cards fade in sekventiellt (0.1s delay mellan varje)
- Chart animeras från vänster
- Smooth transitions

### Interactions
- Button clicks: Subtle scale down (0.95)
- Card hovers: Smooth shadow transition (0.2s)
- Chart hover: Smooth color change

---

## 📐 Spacing & Typography

### Spacing
- Container padding: 2rem (lg:px-8)
- Card gap: 1.5rem (gap-6)
- Section margin: 2rem (mb-8)
- Card padding: 1.5rem (p-6)

### Typography
- H1: 3xl, bold, gray-900
- H2: xl, bold, gray-900
- H3: base, semibold, gray-900
- Body: base, normal, gray-600
- Small: sm, normal, gray-500

---

## 🎯 Call-to-Actions

### Primary CTA (Upload)
```
[📤 Analysera ny faktura]

Bakgrund: #0052cc (primary)
Text: Vit
Hover: #0040A0
Padding: px-4 py-2
Border radius: lg (0.5rem)
```

### Secondary CTA (Links)
```
[Se bättre avtal →]

Text: #0052cc
Hover: #0040A0
Icon: ArrowUpRight, 4x4
```

---

Detta ger en komplett bild av hur dashboardet ser ut och fungerar visuellt! 🎨
