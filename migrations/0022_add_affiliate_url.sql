-- Add affiliate_url column to electricity_providers
ALTER TABLE electricity_providers
ADD COLUMN IF NOT EXISTS affiliate_url TEXT;


