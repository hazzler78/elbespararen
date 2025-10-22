-- Migration för att lägga till user_hidden kolumn
-- Kör med: npx wrangler d1 execute elbespararen-db --file=migrations/0004_add_user_hidden.sql

-- Lägg till user_hidden kolumn
ALTER TABLE electricity_providers ADD COLUMN user_hidden BOOLEAN NOT NULL DEFAULT false;

-- Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_providers_user_hidden ON electricity_providers(user_hidden);
