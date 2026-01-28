-- Script för att läsa ALLA chat-meddelanden
-- Kör med: wrangler d1 execute elbespararen-db --file=scripts/read-all-chat-messages.sql
-- För remote: wrangler d1 execute elbespararen-db --remote --file=scripts/read-all-chat-messages.sql

SELECT 
  id,
  session_id,
  role,
  content,
  context,
  ip_address,
  user_agent,
  model,
  response_time_ms,
  error,
  created_at
FROM chat_messages
ORDER BY created_at DESC;
