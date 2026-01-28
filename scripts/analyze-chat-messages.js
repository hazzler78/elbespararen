/**
 * Script för att analysera chat-meddelanden och skapa förbättringsförslag
 * Kör med: node scripts/analyze-chat-messages.js --remote
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'elbespararen-db';
const args = process.argv.slice(2);
const isRemote = args.includes('--remote') || args.includes('-r');

console.log('📊 Analyserar chat-meddelanden...\n');

try {
  const command = isRemote
    ? `wrangler d1 execute ${DB_NAME} --remote --command="SELECT role, content, created_at, session_id FROM chat_messages ORDER BY created_at DESC;" --json`
    : `wrangler d1 execute ${DB_NAME} --command="SELECT role, content, created_at, session_id FROM chat_messages ORDER BY created_at DESC;" --json`;

  const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  
  let result;
  try {
    result = JSON.parse(output.trim());
  } catch (e) {
    const lines = output.split('\n');
    const jsonStart = lines.findIndex(l => l.trim().startsWith('[') || l.trim().startsWith('{'));
    if (jsonStart !== -1) {
      result = JSON.parse(lines.slice(jsonStart).join('\n'));
    } else {
      throw new Error('Kunde inte parsa JSON');
    }
  }

  let messages = [];
  if (Array.isArray(result) && result.length > 0 && result[0].results) {
    messages = result[0].results;
  } else if (result.results && Array.isArray(result.results)) {
    messages = result.results;
  } else if (Array.isArray(result)) {
    messages = result;
  }

  if (messages.length === 0) {
    console.log('Inga meddelanden hittades.');
    return;
  }

  // Analysera meddelanden
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  // Gruppera per session
  const sessions = {};
  messages.forEach(msg => {
    const sessionId = msg.session_id || 'unknown';
    if (!sessions[sessionId]) {
      sessions[sessionId] = { user: [], assistant: [] };
    }
    if (msg.role === 'user') {
      sessions[sessionId].user.push(msg);
    } else if (msg.role === 'assistant') {
      sessions[sessionId].assistant.push(msg);
    }
  });

  // Analysera vanliga frågor
  const commonQuestions = {};
  userMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    // Identifiera frågetyper
    if (content.includes('kostar') || content.includes('pris') || content.includes('avgift')) {
      commonQuestions['Kostnad/pris'] = (commonQuestions['Kostnad/pris'] || 0) + 1;
    }
    if (content.includes('byta') || content.includes('bytte') || content.includes('leverantör')) {
      commonQuestions['Byt leverantör'] = (commonQuestions['Byt leverantör'] || 0) + 1;
    }
    if (content.includes('flytta') || content.includes('nytt hus') || content.includes('ny avtal')) {
      commonQuestions['Flytta/nytt avtal'] = (commonQuestions['Flytta/nytt avtal'] || 0) + 1;
    }
    if (content.includes('app') || content.includes('ladda ner') || content.includes('appstore')) {
      commonQuestions['App-förvirring'] = (commonQuestions['App-förvirring'] || 0) + 1;
    }
    if (content.includes('spara') || content.includes('besparing')) {
      commonQuestions['Besparingar'] = (commonQuestions['Besparingar'] || 0) + 1;
    }
    if (content.includes('faktura') || content.includes('räkning')) {
      commonQuestions['Faktura/räkning'] = (commonQuestions['Faktura/räkning'] || 0) + 1;
    }
    if (content.includes('vem') || content.includes('vilken') || content.includes('vilket')) {
      commonQuestions['Rekommendationer'] = (commonQuestions['Rekommendationer'] || 0) + 1;
    }
  });

  // Analysera problem i svaren
  const problems = {
    'Nämner "app" istället för "webbplats"': 0,
    'För långa svar': 0,
    'För generiska svar': 0,
    'Saknar konkreta råd': 0,
  };

  assistantMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    if (content.includes('app') && !content.includes('webbplats')) {
      problems['Nämner "app" istället för "webbplats"']++;
    }
    if (msg.content.length > 200) {
      problems['För långa svar']++;
    }
    if (content.includes('kan hjälpa') && content.includes('ladda upp')) {
      problems['För generiska svar']++;
    }
  });

  // Skapa rapport
  const report = {
    sammanfattning: {
      totaltMeddelanden: messages.length,
      användarmeddelanden: userMessages.length,
      aiSvar: assistantMessages.length,
      antalSessioner: Object.keys(sessions).length,
      genomsnittligMeddelandenPerSession: (messages.length / Object.keys(sessions).length).toFixed(1)
    },
    vanligaFrågor: Object.entries(commonQuestions)
      .sort((a, b) => b[1] - a[1])
      .map(([question, count]) => ({ fråga: question, antal: count })),
    problemområden: Object.entries(problems)
      .filter(([_, count]) => count > 0)
      .map(([problem, count]) => ({ problem, antal: count })),
    exempelFrågor: userMessages.slice(0, 10).map(m => m.content),
    exempelSvar: assistantMessages.slice(0, 10).map(m => m.content)
  };

  // Spara rapport
  const reportFile = path.join(__dirname, '..', 'CHAT_ANALYSIS_REPORT.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('✅ Analys klar!\n');
  console.log('📊 SAMMANFATTNING:');
  console.log(`   Totalt meddelanden: ${report.sammanfattning.totaltMeddelanden}`);
  console.log(`   Användarfrågor: ${report.sammanfattning.användarmeddelanden}`);
  console.log(`   AI-svar: ${report.sammanfattning.aiSvar}`);
  console.log(`   Sessioner: ${report.sammanfattning.antalSessioner}`);
  console.log(`   Meddelanden/session: ${report.sammanfattning.genomsnittligMeddelandenPerSession}\n`);

  console.log('❓ VANLIGA FRÅGOR:');
  report.vanligaFrågor.forEach(item => {
    console.log(`   ${item.fråga}: ${item.antal} gånger`);
  });

  console.log('\n⚠️  PROBLEMOMRÅDEN:');
  if (report.problemområden.length > 0) {
    report.problemområden.forEach(item => {
      console.log(`   ${item.problem}: ${item.antal} gånger`);
    });
  } else {
    console.log('   Inga större problem identifierade');
  }

  console.log(`\n💾 Rapport sparad till: ${reportFile}`);
  
} catch (error) {
  console.error('❌ Fel:', error.message);
  process.exit(1);
}
