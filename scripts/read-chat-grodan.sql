-- Script för att läsa chat-meddelanden som innehåller "Grodan"
-- Kör med: wrangler d1 execute elbespararen-db --file=scripts/read-chat-grodan.sql

SELECT 
  id,
  session_id,
  role,
  content,
  created_at,
  ip_address,
  model,
  response_time_ms
FROM chat_messages
WHERE content LIKE '%Grodan%'
ORDER BY created_at DESC
LIMIT 100;

