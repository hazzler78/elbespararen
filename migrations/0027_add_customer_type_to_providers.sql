-- Add customer_type column to distinguish business vs private offers
ALTER TABLE electricity_providers ADD COLUMN customer_type TEXT NOT NULL DEFAULT 'private';

-- Backfill existing rows just in case (SQLite adds default automatically, but be explicit)
UPDATE electricity_providers
SET customer_type = 'private'
WHERE customer_type IS NULL;

-- Helpful index for filtering by audience
CREATE INDEX IF NOT EXISTS idx_providers_customer_type ON electricity_providers(customer_type);

