-- Migration 0030: Create chat_messages table
-- Skapar tabell för att lagra AI-chattmeddelanden för förbättring av AI:n

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL, -- Unik session-ID för varje chat-session
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context TEXT, -- JSON string med fakturakontext om det finns
  ip_address TEXT, -- Användarens IP-adress (för rate limiting och analytics)
  user_agent TEXT, -- Browser user agent
  model TEXT, -- AI-modell som användes (t.ex. "gpt-4o-mini")
  response_time_ms INTEGER, -- Svarstid i millisekunder
  error TEXT, -- Felmeddelande om något gick fel
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ip_address ON chat_messages(ip_address);

