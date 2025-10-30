-- Migration 0021: Create price cache table for normalized provider price lookups
CREATE TABLE IF NOT EXISTS price_cache (
  provider_key TEXT NOT NULL,
  area TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON string of normalized payload
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (provider_key, area)
);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_price_cache_updated_at ON price_cache(updated_at);

