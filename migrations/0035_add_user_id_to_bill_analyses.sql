-- Migration 0035: Add user_id to bill_analyses
-- Kopplar fakturaanalyser till användare

-- Lägg till user_id kolumn
ALTER TABLE bill_analyses ADD COLUMN user_id TEXT;

-- Skapa index för snabb sökning på användare
CREATE INDEX IF NOT EXISTS idx_bill_analyses_user_id ON bill_analyses(user_id);

-- Skapa foreign key constraint (om SQLite stödjer det)
-- SQLite stödjer inte FOREIGN KEY constraints direkt, så vi hoppar över detta
-- Men vi behåller indexet för prestanda
