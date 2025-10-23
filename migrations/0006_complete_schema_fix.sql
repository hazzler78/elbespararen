-- Complete schema fix for missing columns
-- This migration adds all missing columns that the application expects

-- Add contract_type column if it doesn't exist
ALTER TABLE electricity_providers ADD COLUMN contract_type TEXT DEFAULT 'rörligt';

-- Add avtalsalternativ column if it doesn't exist  
ALTER TABLE electricity_providers ADD COLUMN avtalsalternativ TEXT;

-- Add user_hidden column if it doesn't exist
ALTER TABLE electricity_providers ADD COLUMN user_hidden BOOLEAN NOT NULL DEFAULT false;

-- Update existing rows to have default values
UPDATE electricity_providers SET contract_type = 'rörligt' WHERE contract_type IS NULL;
UPDATE electricity_providers SET user_hidden = false WHERE user_hidden IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_providers_contract_type ON electricity_providers(contract_type);
CREATE INDEX IF NOT EXISTS idx_providers_user_hidden ON electricity_providers(user_hidden);

-- Verify the schema
.schema electricity_providers
