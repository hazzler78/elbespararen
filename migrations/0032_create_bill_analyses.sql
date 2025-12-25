-- Migration 0032: Create bill_analyses table
-- Skapar tabell för att spara alla fakturaanalyser för admin-granskning och kvalitetskontroll

CREATE TABLE IF NOT EXISTS bill_analyses (
  id TEXT PRIMARY KEY,
  bill_data TEXT NOT NULL, -- JSON string med BillData
  savings_data TEXT NOT NULL, -- JSON string med SavingsCalculation
  image_key TEXT, -- Nyckel till fakturabilden i Supabase storage
  image_url TEXT, -- Ev. publik URL till fakturabilden
  original_file_name TEXT, -- Ursprungligt filnamn på fakturan
  postal_code TEXT, -- Postnummer om det angavs
  price_area TEXT, -- Prisområde (se1, se2, se3, se4)
  ai_confidence REAL, -- AI:s confidence-nivå (0-1)
  ai_warnings TEXT, -- JSON array med varningar från AI
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'correct', 'incorrect', 'needs_review')), -- Admin-validering
  validation_notes TEXT, -- Anteckningar från admin om eventuella fel
  validated_by TEXT, -- Admin som validerade (om validerad)
  validated_at TEXT, -- När analysen validerades
  ip_address TEXT, -- Användarens IP-adress
  user_agent TEXT, -- Browser user agent
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::TEXT)
);

-- Index för bättre prestanda och queries
CREATE INDEX IF NOT EXISTS idx_bill_analyses_validation_status ON bill_analyses(validation_status);
CREATE INDEX IF NOT EXISTS idx_bill_analyses_created_at ON bill_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_analyses_postal_code ON bill_analyses(postal_code);
CREATE INDEX IF NOT EXISTS idx_bill_analyses_price_area ON bill_analyses(price_area);
CREATE INDEX IF NOT EXISTS idx_bill_analyses_ai_confidence ON bill_analyses(ai_confidence);

