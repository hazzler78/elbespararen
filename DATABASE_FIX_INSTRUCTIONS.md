# 🚨 Database Schema Fix - URGENT

## Problem
The application is returning 500 errors because the database schema is missing required columns:
- `contract_type` 
- `avtalsalternativ`
- `user_hidden`

## Solution
Apply the database migration to add missing columns.

---

## 📋 Step 1: Access Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Login with your account
3. Navigate to **Workers & Pages** → **D1 SQL Database**
4. Select your database: **elbespararen-db**

---

## 📝 Step 2: Open Console

1. Click on the **Console** tab
2. This opens the SQL editor

---

## 🗄️ Step 3: Apply Migration

Copy and paste this SQL code into the Console and execute:

```sql
-- Complete schema fix for missing columns
-- This migration adds all missing columns that the application expects

-- Add contract_type column if it doesn't exist
ALTER TABLE electricity_providers ADD COLUMN contract_type TEXT DEFAULT 'rörligt';

-- Add avtalsalternativ column if it doesn't exist  
ALTER TABLE electricity_providers ADD COLUMN avtalsalternativ TEXT;

-- Add user_hidden column if it doesn't exist
ALTER TABLE electricity_providers ADD COLUMN user_hidden BOOLEAN NOT NULL DEFAULT false;

-- Update existing rows to have default values
UPDATE electricity_providers SET contract_type = 'rörligt' WHERE contract_type IS NULL;
UPDATE electricity_providers SET user_hidden = false WHERE user_hidden IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_providers_contract_type ON electricity_providers(contract_type);
CREATE INDEX IF NOT EXISTS idx_providers_user_hidden ON electricity_providers(user_hidden);
```

---

## 🌱 Step 4: Seed Provider Data (if needed)

If you don't have any providers in the database, run this to add sample data:

```sql
-- Clear existing data (if any)
DELETE FROM electricity_providers;

-- Add sample providers
INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, contract_type, is_active, user_hidden, features, 
  logo_url, website_url, phone_number, avtalsalternativ, created_at, updated_at
) VALUES 
(
  'cheap-energy-1',
  'Cheap Energy',
  'Billigaste alternativet med 0 kr i månadskostnad och 0 kr de första 12 månaderna',
  0,
  0.45,
  12,
  12,
  'rörligt',
  1,
  0,
  '["0 kr månadskostnad", "0 kr de första 12 månaderna", "Ingen bindningstid", "Spotpris + 0 kr påslag"]',
  '/logos/cheap-energy.svg',
  'https://cheapenergy.se',
  '08-123 45 67',
  '[]',
  datetime('now'),
  datetime('now')
),
(
  'green-power-2',
  'Green Power',
  'Miljövänlig el med 100% förnybar energi',
  29,
  0.52,
  0,
  24,
  'rörligt',
  1,
  0,
  '["100% förnybar energi", "Låg månadskostnad", "Miljöcertifierat", "24 månaders bindningstid"]',
  '/logos/greenely.svg',
  'https://greenpower.se',
  '08-234 56 78',
  '[]',
  datetime('now'),
  datetime('now')
);
```

---

## ✅ Step 5: Verify Fix

After applying the migration:

1. The API endpoints should return 200 instead of 500
2. The admin panel should load providers correctly
3. No more "Internal Server Error" messages

---

## 🔍 Troubleshooting

If you still get errors:

1. **Check if tables exist:**
   ```sql
   .tables
   ```

2. **Check table schema:**
   ```sql
   .schema electricity_providers
   ```

3. **Check if data exists:**
   ```sql
   SELECT COUNT(*) FROM electricity_providers;
   ```

---

## 📞 Support

If you need help, check the Cloudflare D1 documentation or contact support.
