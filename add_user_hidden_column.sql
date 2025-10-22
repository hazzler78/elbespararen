-- Lägg till user_hidden kolumn i electricity_providers tabellen
-- Kopiera och klistra in denna SQL i Cloudflare Dashboard -> D1 -> SQL Editor

ALTER TABLE electricity_providers ADD COLUMN user_hidden BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_providers_user_hidden ON electricity_providers(user_hidden);
