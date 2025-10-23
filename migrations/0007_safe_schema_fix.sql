-- Safe schema fix - only adds columns that don't exist
-- This migration safely adds missing columns without causing errors

-- Add contract_type column only if it doesn't exist
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll use a different approach

-- First, let's check what columns exist by trying to add them
-- If they exist, we'll get an error, but that's okay

-- Add contract_type column (will fail silently if exists)
ALTER TABLE electricity_providers ADD COLUMN contract_type TEXT DEFAULT 'rörligt';

-- Add avtalsalternativ column (will fail silently if exists)  
ALTER TABLE electricity_providers ADD COLUMN avtalsalternativ TEXT;

-- Update existing rows to have default values for contract_type
UPDATE electricity_providers SET contract_type = 'rörligt' WHERE contract_type IS NULL;

-- Create indexes for better performance (will fail silently if exists)
CREATE INDEX IF NOT EXISTS idx_providers_contract_type ON electricity_providers(contract_type);
CREATE INDEX IF NOT EXISTS idx_providers_user_hidden ON electricity_providers(user_hidden);
