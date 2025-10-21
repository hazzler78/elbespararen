# 🚀 Cloudflare D1 Database Setup - Steg-för-steg

## Problem
Du ser leverantörer lokalt men inte i Cloudflare's produktionsdatabas.

## Lösning
Följ dessa steg för att seeda din Cloudflare D1-databas med leverantörsdata.

---

## 📋 Steg 1: Gå till Cloudflare Dashboard

1. Öppna [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Logga in med ditt konto
3. Välj **Workers & Pages** från sidomenyn
4. Klicka på **D1 SQL Database**
5. Välj din databas: **elbespararen-db**

---

## 📝 Steg 2: Öppna Console

1. I din databas-sida, hitta fliken **Console**
2. Klicka på **Console** för att öppna SQL-editorn

---

## 🗄️ Steg 3: Kör Migrations (om inte redan gjort)

Om tabellerna inte finns, kör först dessa SQL-kommandon:

```sql
-- Skapa electricity_providers tabell
CREATE TABLE IF NOT EXISTS electricity_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  monthly_fee REAL NOT NULL DEFAULT 0,
  energy_price REAL NOT NULL,
  free_months INTEGER NOT NULL DEFAULT 0,
  contract_length INTEGER NOT NULL DEFAULT 12,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features TEXT,
  logo_url TEXT,
  website_url TEXT,
  phone_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Skapa switch_requests tabell
CREATE TABLE IF NOT EXISTS switch_requests (
  id TEXT PRIMARY KEY,
  customer_info TEXT NOT NULL,
  address TEXT NOT NULL,
  current_provider TEXT NOT NULL,
  new_provider TEXT NOT NULL,
  bill_data TEXT NOT NULL,
  savings TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Skapa leads tabell
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  name TEXT,
  message TEXT,
  bill_data TEXT,
  savings_data TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌱 Steg 4: Seed Provider Data

Kopiera och klistra in **hela** SQL-koden nedan i Console och kör:

```sql
-- Rensa befintlig data (om någon finns)
DELETE FROM electricity_providers;

-- Lägg till Cheap Energy
INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, is_active, features, logo_url, website_url, 
  phone_number, created_at, updated_at
) VALUES (
  'cheap-energy-1',
  'Cheap Energy',
  'Billigaste alternativet med 0 kr i månadskostnad och 0 kr de första 12 månaderna',
  0,
  0.45,
  12,
  12,
  1,
  '["0 kr månadskostnad", "0 kr de första 12 månaderna", "Ingen bindningstid", "Spotpris + 0 kr påslag"]',
  '/logos/cheap-energy.png',
  'https://cheapenergy.se',
  '08-123 45 67',
  datetime('now'),
  datetime('now')
);

-- Lägg till Green Power
INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, is_active, features, logo_url, website_url, 
  phone_number, created_at, updated_at
) VALUES (
  'green-power-2',
  'Green Power',
  'Miljövänlig el med 100% förnybar energi',
  29,
  0.52,
  0,
  24,
  1,
  '["100% förnybar energi", "Låg månadskostnad", "Miljöcertifierat", "24 månaders bindningstid"]',
  '/logos/green-power.png',
  'https://greenpower.se',
  '08-234 56 78',
  datetime('now'),
  datetime('now')
);

-- Lägg till Eco Power
INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, is_active, features, logo_url, website_url, 
  phone_number, created_at, updated_at
) VALUES (
  'eco-power-3',
  'Eco Power',
  'Hållbar el med transparenta priser',
  19,
  0.48,
  6,
  18,
  1,
  '["Hållbar el", "Transparenta priser", "6 månader gratis", "18 månaders bindningstid"]',
  '/logos/eco-power.png',
  'https://ecopower.se',
  '08-345 67 89',
  datetime('now'),
  datetime('now')
);
```

---

## ✅ Steg 5: Verifiera Data

Kör detta kommando för att verifiera att leverantörerna är inlagda:

```sql
SELECT id, name, monthly_fee, energy_price, free_months, is_active 
FROM electricity_providers 
ORDER BY energy_price ASC;
```

Du bör se 3 leverantörer:
- **Cheap Energy** (energyPrice: 0.45)
- **Eco Power** (energyPrice: 0.48)
- **Green Power** (energyPrice: 0.52)

---

## 🔍 Steg 6: Kontrollera Switch Requests

För att se alla bytförfrågningar som kommit in:

```sql
SELECT id, status, created_at 
FROM switch_requests 
ORDER BY created_at DESC;
```

---

## 🎉 Klart!

Nu bör din Cloudflare-applikation visa leverantörer och spara bytförfrågningar korrekt i D1-databasen.

### Troubleshooting

**Problem:** Ser fortfarande inte leverantörer på produktionssidan
- **Lösning:** Kontrollera att din Cloudflare Pages deployment använder rätt databas-binding
- Gå till: Workers & Pages > din site > Settings > Functions > D1 database bindings
- Verifiera att `DB` är bundet till `elbespararen-db`

**Problem:** Kan inte se switch requests
- **Lösning:** Kontrollera att tabellen `switch_requests` finns:
```sql
SELECT name FROM sqlite_master WHERE type='table';
```

---

## 📚 Nästa Steg

När allt fungerar:
1. Testa att analysera en faktura på produktionssidan
2. Kontrollera att leverantörer visas korrekt
3. Testa att fylla i bytformulär
4. Verifiera att data sparas i D1-databasen via Console

Lycka till! 🚀
