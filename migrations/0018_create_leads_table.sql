-- Migration 0018: Create leads table
-- Skapar tabell för att lagra leads från kontaktformulär

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  bill_data TEXT NOT NULL, -- JSON string
  savings TEXT NOT NULL, -- JSON string
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
