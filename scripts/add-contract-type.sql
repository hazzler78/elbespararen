-- Lägg till contract_type kolumn till electricity_providers tabellen
-- Kör detta i Cloudflare Dashboard Console

ALTER TABLE electricity_providers ADD COLUMN contract_type TEXT DEFAULT 'rörligt';

-- Uppdatera befintliga rader till rörligt avtal
UPDATE electricity_providers SET contract_type = 'rörligt' WHERE contract_type IS NULL;

-- Verifiera att kolumnen är tillagd
SELECT id, name, contract_type FROM electricity_providers LIMIT 5;
