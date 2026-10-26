-- Migration 0033: Solar panel leads (Otovo partner API)
-- Stores form submissions before/after Otovo sync for retry and auditing.

CREATE TABLE IF NOT EXISTS solar_leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  yearly_consumption_kwh INTEGER,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'homepage',
  otovo_status TEXT NOT NULL DEFAULT 'pending',
  otovo_interest_id TEXT,
  otovo_error TEXT,
  utm_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_solar_leads_created_at ON solar_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_solar_leads_otovo_status ON solar_leads(otovo_status);
CREATE INDEX IF NOT EXISTS idx_solar_leads_email ON solar_leads(email);
