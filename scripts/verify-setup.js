#!/usr/bin/env node

/**
 * Verifieringsskript för Elbespararen v7
 * Kontrollerar att allt är korrekt konfigurerat
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let hasErrors = false;
let hasWarnings = false;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function check(name, condition, errorMessage, warningOnly = false) {
  if (condition) {
    log(`✓ ${name}`, GREEN);
    return true;
  } else {
    if (warningOnly) {
      log(`⚠ ${name}: ${errorMessage}`, YELLOW);
      hasWarnings = true;
    } else {
      log(`✗ ${name}: ${errorMessage}`, RED);
      hasErrors = true;
    }
    return false;
  }
}

console.log('\n🔍 Verifierar Elbespararen v7 setup...\n');

// Check files
log('📁 Checking files...', YELLOW);
check('package.json', fs.existsSync('package.json'), 'package.json saknas');
check('tsconfig.json', fs.existsSync('tsconfig.json'), 'tsconfig.json saknas');
check('next.config.ts', fs.existsSync('next.config.ts'), 'next.config.ts saknas');
check('.gitignore', fs.existsSync('.gitignore'), '.gitignore saknas');

// Check directories
log('\n📂 Checking directories...', YELLOW);
check('src/app', fs.existsSync('src/app'), 'src/app directory saknas');
check('src/components', fs.existsSync('src/components'), 'src/components directory saknas');
check('src/lib', fs.existsSync('src/lib'), 'src/lib directory saknas');

// Check key files
log('\n📄 Checking key files...', YELLOW);
check('lib/types.ts', fs.existsSync('src/lib/types.ts'), 'src/lib/types.ts saknas');
check('lib/schema.ts', fs.existsSync('src/lib/schema.ts'), 'src/lib/schema.ts saknas');
check('lib/calculations.ts', fs.existsSync('src/lib/calculations.ts'), 'src/lib/calculations.ts saknas');
check('lib/constants.ts', fs.existsSync('src/lib/constants.ts'), 'src/lib/constants.ts saknas');

// Check API routes
log('\n🔌 Checking API routes...', YELLOW);
check('API: parse-bill-v3', fs.existsSync('src/app/api/parse-bill-v3/route.ts'), 'parse-bill-v3 route saknas');
check('API: leads', fs.existsSync('src/app/api/leads/route.ts'), 'leads route saknas');
check('API: chat', fs.existsSync('src/app/api/chat/route.ts'), 'chat route saknas');

// Check pages
log('\n📄 Checking pages...', YELLOW);
check('Page: home', fs.existsSync('src/app/page.tsx'), 'home page saknas');
check('Page: upload', fs.existsSync('src/app/upload/page.tsx'), 'upload page saknas');
check('Page: confirm', fs.existsSync('src/app/confirm/page.tsx'), 'confirm page saknas');
check('Page: result', fs.existsSync('src/app/result/page.tsx'), 'result page saknas');
check('Page: admin', fs.existsSync('src/app/admin/page.tsx'), 'admin page saknas');

// Check components
log('\n🧩 Checking components...', YELLOW);
check('Component: UploadCard', fs.existsSync('src/components/UploadCard.tsx'), 'UploadCard saknas');
check('Component: ResultSummary', fs.existsSync('src/components/ResultSummary.tsx'), 'ResultSummary saknas');
check('Component: ExtraFeesList', fs.existsSync('src/components/ExtraFeesList.tsx'), 'ExtraFeesList saknas');
check('Component: ConfidenceBadge', fs.existsSync('src/components/ConfidenceBadge.tsx'), 'ConfidenceBadge saknas');
check('Component: ContactForm', fs.existsSync('src/components/ContactForm.tsx'), 'ContactForm saknas');
check('Component: StickyCTA', fs.existsSync('src/components/StickyCTA.tsx'), 'StickyCTA saknas');

// Check environment
log('\n🔐 Checking environment...', YELLOW);
const hasEnvLocal = fs.existsSync('.env.local');
check('.env.local', hasEnvLocal, '.env.local saknas (kopiera från .env.example)', true);

if (hasEnvLocal) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  check(
    'XAI_API_KEY',
    envContent.includes('XAI_API_KEY=xai-') || envContent.includes('OPENAI_API_KEY='),
    'XAI_API_KEY inte konfigurerad',
    true
  );
}

// Check dependencies
log('\n📦 Checking dependencies...', YELLOW);
const hasNodeModules = fs.existsSync('node_modules');
check('node_modules', hasNodeModules, 'Kör npm install', !hasNodeModules);

if (hasNodeModules) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  check('next', packageJson.dependencies?.next, 'Next.js saknas');
  check('react', packageJson.dependencies?.react, 'React saknas');
  check('openai', packageJson.dependencies?.openai, 'OpenAI SDK saknas');
  check('framer-motion', packageJson.dependencies?.['framer-motion'], 'Framer Motion saknas');
  check('lucide-react', packageJson.dependencies?.['lucide-react'], 'Lucide React saknas');
}

// Check documentation
log('\n📚 Checking documentation...', YELLOW);
check('README.md', fs.existsSync('README.md'), 'README.md saknas');
check('DEPLOYMENT.md', fs.existsSync('DEPLOYMENT.md'), 'DEPLOYMENT.md saknas', true);
check('CONTRIBUTING.md', fs.existsSync('CONTRIBUTING.md'), 'CONTRIBUTING.md saknas', true);

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  log('\n❌ Verifieringen misslyckades. Fixa felen ovan innan du fortsätter.', RED);
  process.exit(1);
} else if (hasWarnings) {
  log('\n⚠️  Verifieringen godkänd med varningar. Appen borde fungera, men vissa features kan saknas.', YELLOW);
  process.exit(0);
} else {
  log('\n✅ Allt ser bra ut! Kör "npm run dev" för att starta appen.', GREEN);
  process.exit(0);
}

