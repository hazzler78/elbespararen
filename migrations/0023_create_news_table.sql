-- Migration 0023: Create news table
-- Skapar tabell för att lagra nyheter och pressmeddelanden

CREATE TABLE IF NOT EXISTS news_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  external_link TEXT,
  published_at TEXT,
  is_published BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_news_published ON news_posts(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_posts(published_at);

