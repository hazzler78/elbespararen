-- Migration 0031: Create postal_code_analytics table
-- Skapar tabell för att spara postnummer och områdesdata för analytics och marknadsföring

CREATE TABLE IF NOT EXISTS postal_code_analytics (
  id TEXT PRIMARY KEY,
  postal_code TEXT NOT NULL, -- Postnummer som användaren skrev in
  detected_area TEXT, -- Automatiskt detekterat område (se1, se2, se3, se4)
  selected_area TEXT NOT NULL, -- Slutligt valt område (kan vara samma som detected eller manuellt ändrat)
  was_manually_changed INTEGER NOT NULL DEFAULT 0, -- 1 om användaren ändrade området manuellt, 0 annars
  ip_address TEXT, -- Användarens IP-adress (för analytics)
  user_agent TEXT, -- Browser user agent
  page_context TEXT, -- Var användaren var när de angav postnummer (t.ex. "upload", "contracts")
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index för bättre prestanda och analytics queries
CREATE INDEX IF NOT EXISTS idx_postal_code_analytics_postal_code ON postal_code_analytics(postal_code);
CREATE INDEX IF NOT EXISTS idx_postal_code_analytics_selected_area ON postal_code_analytics(selected_area);
CREATE INDEX IF NOT EXISTS idx_postal_code_analytics_detected_area ON postal_code_analytics(detected_area);
CREATE INDEX IF NOT EXISTS idx_postal_code_analytics_created_at ON postal_code_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_postal_code_analytics_was_changed ON postal_code_analytics(was_manually_changed);
CREATE INDEX IF NOT EXISTS idx_postal_code_analytics_page_context ON postal_code_analytics(page_context);
