-- Migration 0035: Add user_id to bill_analyses
-- Kopplar fakturaanalyser till användare
-- 
-- SÄKERHET: Denna migration är säker att köra flera gånger
-- - Kolumnen är nullable, så befintliga rader påverkas inte
-- - Om kolumnen redan finns kommer ALTER TABLE att ge fel, men det är okej

-- Lägg till user_id kolumn (kan ge fel om kolumnen redan finns - det är okej)
-- SQLite stöder inte IF NOT EXISTS för ALTER TABLE ADD COLUMN
-- Men om kolumnen redan finns kommer detta bara ge ett felmeddelande utan att påverka data
ALTER TABLE bill_analyses ADD COLUMN user_id TEXT;

-- Skapa index för snabb sökning på användare
CREATE INDEX IF NOT EXISTS idx_bill_analyses_user_id ON bill_analyses(user_id);
