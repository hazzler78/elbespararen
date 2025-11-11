-- Cloudflare D1 Database Schema för Elbespararen v7
-- Förberedd för framtida migration från mock data

-- Elleverantörer tabell
CREATE TABLE IF NOT EXISTS electricity_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  monthly_fee REAL NOT NULL DEFAULT 0,
  energy_price REAL NOT NULL,
  free_months INTEGER NOT NULL DEFAULT 0,
  contract_length INTEGER NOT NULL DEFAULT 12,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features TEXT, -- JSON array som string
  logo_url TEXT,
  website_url TEXT,
  phone_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads tabell (för kontaktförfrågningar)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  name TEXT,
  message TEXT,
  bill_data TEXT, -- JSON som string
  savings_data TEXT, -- JSON som string
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, converted, rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Switch requests tabell (för bytförfrågningar)
CREATE TABLE IF NOT EXISTS switch_requests (
  id TEXT PRIMARY KEY,
  customer_info TEXT NOT NULL, -- JSON som string
  address TEXT NOT NULL, -- JSON som string
  current_provider TEXT NOT NULL, -- JSON som string
  new_provider TEXT NOT NULL, -- JSON som string
  bill_data TEXT NOT NULL, -- JSON som string
  savings TEXT NOT NULL, -- JSON som string
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, cancelled
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_providers_active ON electricity_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_providers_energy_price ON electricity_providers(energy_price);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_switch_requests_status ON switch_requests(status);
CREATE INDEX IF NOT EXISTS idx_switch_requests_created_at ON switch_requests(created_at);

-- Triggers för updated_at
CREATE TRIGGER IF NOT EXISTS update_providers_timestamp 
  AFTER UPDATE ON electricity_providers
  BEGIN
    UPDATE electricity_providers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_leads_timestamp 
  AFTER UPDATE ON leads
  BEGIN
    UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_switch_requests_timestamp 
  AFTER UPDATE ON switch_requests
  BEGIN
    UPDATE switch_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
