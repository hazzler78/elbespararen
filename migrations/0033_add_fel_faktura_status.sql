-- Migration 0033: Add 'fel_faktura' validation status
-- Lägger till en ny valideringsstatus "Fel faktura" för fakturaanalyser

-- Först, ta bort den gamla CHECK constraint
-- SQLite stöder inte ALTER TABLE DROP CONSTRAINT direkt, så vi behöver:
-- 1. Skapa en ny tabell med rätt constraint
-- 2. Kopiera data
-- 3. Ta bort gamla tabellen
-- 4. Döpa om nya tabellen

-- Skapa ny tabell med uppdaterad constraint
CREATE TABLE IF NOT EXISTS bill_analyses_new (
  id TEXT PRIMARY KEY,
  bill_data TEXT NOT NULL,
  savings_data TEXT NOT NULL,
  image_key TEXT,
  image_url TEXT,
  original_file_name TEXT,
  postal_code TEXT,
  price_area TEXT,
  ai_confidence REAL,
  ai_warnings TEXT,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'correct', 'incorrect', 'needs_review', 'fel_faktura')),
  validation_notes TEXT,
  validated_by TEXT,
  validated_at TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Kopiera data från gamla tabellen
INSERT INTO bill_analyses_new 
SELECT * FROM bill_analyses;

-- Ta bort gamla tabellen
DROP TABLE IF EXISTS bill_analyses;

-- Döp om nya tabellen
ALTER TABLE bill_analyses_new RENAME TO bill_analyses;

-- Återskapa index
CREATE INDEX IF NOT EXISTS idx_bill_analyses_validation_status ON bill_analyses(validation_status);
CREATE INDEX IF NOT EXISTS idx_bill_analyses_created_at ON bill_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_analyses_postal_code ON bill_analyses(postal_code);
CREATE INDEX IF NOT EXISTS idx_bill_analyses_price_area ON bill_analyses(price_area);
CREATE INDEX IF NOT EXISTS idx_bill_analyses_ai_confidence ON bill_analyses(ai_confidence);
