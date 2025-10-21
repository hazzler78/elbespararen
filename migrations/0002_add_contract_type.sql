-- Migration för att lägga till contract_type kolumn
ALTER TABLE electricity_providers ADD COLUMN contract_type TEXT DEFAULT 'rörligt';

-- Uppdatera befintliga rader till rörligt avtal
UPDATE electricity_providers SET contract_type = 'rörligt' WHERE contract_type IS NULL;
