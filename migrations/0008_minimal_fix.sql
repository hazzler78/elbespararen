-- Minimal fix - only add contract_type and avtalsalternativ
-- user_hidden already exists based on the error

-- Add contract_type column
ALTER TABLE electricity_providers ADD COLUMN contract_type TEXT DEFAULT 'rörligt';

-- Add avtalsalternativ column  
ALTER TABLE electricity_providers ADD COLUMN avtalsalternativ TEXT;

-- Update existing rows
UPDATE electricity_providers SET contract_type = 'rörligt' WHERE contract_type IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_providers_contract_type ON electricity_providers(contract_type);
