/**
 * Script för att läsa ALLA chat-meddelanden från D1-databasen
 * Kör med: node scripts/read-all-chat-messages.js
 * 
 * Detta script använder wrangler CLI för att köra SQL direkt mot D1-databasen
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'elbespararen-db';
const SQL_FILE = path.join(__dirname, 'read-all-chat-messages.sql');

// Fråga användaren om de vill köra mot lokal eller remote databas
const args = process.argv.slice(2);
const isRemote = args.includes('--remote') || args.includes('-r');

console.log('📨 Hämtar alla chat-meddelanden...\n');

try {
  // Kör SQL direkt med --json flagga för bättre parsing
  const command = isRemote
    ? `wrangler d1 execute ${DB_NAME} --remote --command="SELECT * FROM chat_messages ORDER BY created_at DESC;" --json`
    : `wrangler d1 execute ${DB_NAME} --command="SELECT * FROM chat_messages ORDER BY created_at DESC;" --json`;

  console.log(`Kör: ${command.replace(/--json$/, '--json (output skrivs till fil)')}\n`);
  
  const output = execSync(command, { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });

  // Parse output från wrangler (JSON format)
  let result;
  try {
    // Försök parsa hela output som JSON
    result = JSON.parse(output.trim());
  } catch (e) {
    // Om det inte fungerar, försök hitta JSON i output
    const lines = output.split('\n');
    let jsonStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('[') || lines[i].trim().startsWith('{')) {
        jsonStart = i;
        break;
      }
    }

    if (jsonStart !== -1) {
      const jsonStr = lines.slice(jsonStart).join('\n');
      result = JSON.parse(jsonStr);
    } else {
      throw new Error('Kunde inte hitta JSON i output');
    }
  }
  
  // Wrangler returnerar resultatet i en array med metadata
  // Det faktiska resultatet finns i result[0].results
  let messages = [];
  if (Array.isArray(result) && result.length > 0 && result[0].results) {
    messages = result[0].results;
  } else if (result.results && Array.isArray(result.results)) {
    messages = result.results;
  } else if (Array.isArray(result)) {
    messages = result;
  }
  
  if (messages.length > 0) {
      
      console.log(`✅ Hittade ${messages.length} meddelanden\n`);
      console.log('='.repeat(80));
      
      // Gruppera meddelanden per session
      const sessions = {};
      messages.forEach(msg => {
        const sessionId = msg.session_id || 'unknown';
        if (!sessions[sessionId]) {
          sessions[sessionId] = [];
        }
        sessions[sessionId].push(msg);
      });

      // Sortera sessioner efter senaste meddelande
      const sortedSessions = Object.entries(sessions).sort((a, b) => {
        const aLatest = new Date(a[1][0].created_at);
        const bLatest = new Date(b[1][0].created_at);
        return bLatest - aLatest;
      });

      sortedSessions.forEach(([sessionId, sessionMessages]) => {
        // Sortera meddelanden inom sessionen efter datum
        sessionMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        console.log(`\n📋 Session: ${sessionId.substring(0, 30)}...`);
        console.log(`   IP: ${sessionMessages[0].ip_address || 'Okänd'}`);
        console.log(`   Antal meddelanden: ${sessionMessages.length}`);
        console.log(`   Första meddelande: ${sessionMessages[0].created_at}`);
        console.log(`   Senaste meddelande: ${sessionMessages[sessionMessages.length - 1].created_at}`);
        console.log('-'.repeat(80));
        
        sessionMessages.forEach((msg, idx) => {
          const role = msg.role === 'user' ? '👤 Användare' : msg.role === 'assistant' ? '🤖 AI' : '⚙️ System';
          const time = new Date(msg.created_at).toLocaleString('sv-SE');
          
          console.log(`\n${role} [${time}]`);
          console.log(msg.content);
          
          if (msg.model) {
            console.log(`   Modell: ${msg.model}`);
          }
          if (msg.response_time_ms) {
            console.log(`   Svarstid: ${msg.response_time_ms}ms`);
          }
          if (msg.error) {
            console.log(`   ⚠️  Fel: ${msg.error}`);
          }
          if (msg.context) {
            console.log(`   📄 Kontext: ${JSON.stringify(msg.context).substring(0, 100)}...`);
          }
        });
        
        console.log('\n' + '='.repeat(80));
      });

      // Spara till JSON-fil
      const outputFile = path.join(__dirname, '..', 'chat-messages-export.json');
      fs.writeFileSync(outputFile, JSON.stringify(messages, null, 2), 'utf-8');
      console.log(`\n💾 Meddelanden sparade till: ${outputFile}`);
      
      // Statistik
      const userMessages = messages.filter(m => m.role === 'user').length;
      const assistantMessages = messages.filter(m => m.role === 'assistant').length;
      const systemMessages = messages.filter(m => m.role === 'system').length;
      
      console.log('\n📊 Statistik:');
      console.log(`   Totalt meddelanden: ${messages.length}`);
      console.log(`   Användare: ${userMessages}`);
      console.log(`   AI: ${assistantMessages}`);
      console.log(`   System: ${systemMessages}`);
      console.log(`   Sessioner: ${sortedSessions.length}`);
      
    } else {
      console.log('Inga meddelanden hittades.');
      console.log('Raw output:', output);
    }
  } else {
    console.log('Kunde inte parsa output från wrangler.');
    console.log('Raw output:', output);
  }
  
} catch (error) {
  console.error('❌ Fel vid hämtning av meddelanden:', error.message);
  console.error('\nTips:');
  console.error('1. Kontrollera att wrangler är installerat: npm install -g wrangler');
  console.error('2. Kontrollera att du är inloggad: wrangler login');
  console.error('3. För remote databas, lägg till --remote flaggan');
  console.error('4. För lokal databas, se till att dev-servern har startat databasen');
  process.exit(1);
}
