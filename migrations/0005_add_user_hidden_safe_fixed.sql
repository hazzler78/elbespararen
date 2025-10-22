-- Safe migration för user_hidden kolumn
-- Lägger till kolumnen och indexet i rätt ordning

-- Lägg till user_hidden kolumn först
ALTER TABLE electricity_providers ADD COLUMN user_hidden BOOLEAN NOT NULL DEFAULT false;

-- Skapa index för bättre prestanda efter att kolumnen är tillagd
CREATE INDEX IF NOT EXISTS idx_providers_user_hidden ON electricity_providers(user_hidden);
