/**
 * Script för att läsa chat-meddelanden som innehåller "Grodan"
 * Kör med: node scripts/read-chat-grodan.js
 * 
 * OBS: Detta script kräver att appen körs lokalt eller att du har tillgång till databasen
 */

// För att köra mot Cloudflare D1 lokalt:
// wrangler d1 execute elbespararen-db --command="SELECT * FROM chat_messages WHERE content LIKE '%Grodan%' ORDER BY created_at DESC LIMIT 100;"

// För att köra mot remote D1:
// wrangler d1 execute elbespararen-db --remote --command="SELECT * FROM chat_messages WHERE content LIKE '%Grodan%' ORDER BY created_at DESC LIMIT 100;"

console.log(`
För att läsa chat-meddelanden med "Grodan", kör ett av följande kommandon:

1. Lokal D1-databas:
   wrangler d1 execute elbespararen-db --command="SELECT * FROM chat_messages WHERE content LIKE '%Grodan%' ORDER BY created_at DESC LIMIT 100;"

2. Remote D1-databas (produktion):
   wrangler d1 execute elbespararen-db --remote --command="SELECT * FROM chat_messages WHERE content LIKE '%Grodan%' ORDER BY created_at DESC LIMIT 100;"

3. Via SQL-fil:
   wrangler d1 execute elbespararen-db --file=scripts/read-chat-grodan.sql

4. Via admin-sidan (när appen körs):
   Gå till http://localhost:3000/admin/chat och sök efter "Grodan"
`);

