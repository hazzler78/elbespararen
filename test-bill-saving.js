/**
 * Testskript för att verifiera faktura-sparande efter kontoskapande
 * 
 * Användning:
 * 1. Öppna Developer Tools (F12) på elbespararen.se
 * 2. Kopiera och klistra in detta skript i Console
 * 3. Följ instruktionerna
 */

console.log('🧪 Testskript för faktura-sparande');
console.log('=====================================\n');

// Test 1: Kontrollera sessionStorage och localStorage
function testSessionStorage() {
  console.log('📦 Test 1: Kontrollera sessionStorage och localStorage');
  const billDataFromSession = sessionStorage.getItem('billData');
  const billDataFromLocal = localStorage.getItem('pendingBillData');
  const pendingAnalysis = sessionStorage.getItem('pendingAnalysis');
  
  console.log('billData från sessionStorage:', !!billDataFromSession);
  console.log('pendingBillData från localStorage:', !!billDataFromLocal);
  console.log('pendingAnalysis:', pendingAnalysis);
  
  const billData = billDataFromLocal || billDataFromSession;
  
  if (billData) {
    try {
      const parsed = JSON.parse(billData);
      console.log('✅ billData är giltig JSON');
      console.log('   - totalAmount:', parsed.totalAmount);
      console.log('   - confidence:', parsed.confidence);
      console.log('   - postalCode:', parsed.postalCode);
      console.log('   - Källa:', billDataFromLocal ? 'localStorage' : 'sessionStorage');
    } catch (e) {
      console.error('❌ billData är inte giltig JSON:', e);
    }
  } else {
    console.log('⚠️  Ingen billData hittades i varken localStorage eller sessionStorage');
  }
  console.log('');
}

// Test 2: Kontrollera API-endpoint
async function testSavePendingAnalysis() {
  console.log('🌐 Test 2: Testa API-endpoint /api/user/save-pending-analysis');
  
  const billDataFromLocal = localStorage.getItem('pendingBillData');
  const billDataFromSession = sessionStorage.getItem('billData');
  const billData = billDataFromLocal || billDataFromSession;
  
  if (!billData) {
    console.log('⚠️  Ingen billData i varken localStorage eller sessionStorage. Kör detta efter att ha analyserat en faktura.');
    return;
  }
  
  console.log('   - Använder billData från:', billDataFromLocal ? 'localStorage' : 'sessionStorage');
  
  try {
    const response = await fetch('/api/user/save-pending-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ billData: JSON.parse(billData) }),
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ API-endpoint fungerar korrekt');
      console.log('   - Analysis ID:', result.data?.id);
      console.log('   - User ID:', result.data?.userId);
    } else {
      console.error('❌ API-endpoint returnerade fel:', result);
      console.log('   - Status:', response.status);
      console.log('   - Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Fel vid API-anrop:', error);
  }
  console.log('');
}

// Test 3: Kontrollera fakturor på dashboard
async function testDashboardAnalyses() {
  console.log('📊 Test 3: Kontrollera fakturor på dashboard');
  
  try {
    const response = await fetch('/api/user/bill-analyses?range=year', {
      credentials: 'include',
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Hittade ${result.count || result.data?.length || 0} fakturor`);
      
      if (result.data && result.data.length > 0) {
        console.log('\n   Senaste fakturor:');
        result.data.slice(0, 3).forEach((analysis, index) => {
          console.log(`   ${index + 1}. ID: ${analysis.id}`);
          console.log(`      - Skapad: ${analysis.createdAt}`);
          console.log(`      - Belopp: ${analysis.billData?.totalAmount || 'N/A'} kr`);
          console.log(`      - User ID: ${analysis.userId || 'INGEN (ej kopplad)'}`);
          console.log('');
        });
      } else {
        console.log('⚠️  Inga fakturor hittades. Har du analyserat och sparat en faktura?');
      }
    } else {
      console.error('❌ Kunde inte hämta fakturor:', result);
      if (response.status === 401) {
        console.log('   ⚠️  Du är inte inloggad. Logga in först.');
      }
    }
  } catch (error) {
    console.error('❌ Fel vid hämtning av fakturor:', error);
  }
  console.log('');
}

// Test 4: Kontrollera användarinfo
async function testUserInfo() {
  console.log('👤 Test 4: Kontrollera användarinfo');
  
  try {
    const response = await fetch('/api/user/info', {
      credentials: 'include',
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Användarinfo hämtad');
      console.log('   - Email:', result.data?.email);
      console.log('   - Premium:', result.data?.isPremium ? 'Ja' : 'Nej');
      console.log('   - User ID:', result.data?.id);
    } else {
      console.error('❌ Kunde inte hämta användarinfo:', result);
      if (response.status === 401) {
        console.log('   ⚠️  Du är inte inloggad.');
      }
    }
  } catch (error) {
    console.error('❌ Fel vid hämtning av användarinfo:', error);
  }
  console.log('');
}

// Kör alla tester
async function runAllTests() {
  console.log('🚀 Kör alla tester...\n');
  
  testSessionStorage();
  await testUserInfo();
  await testDashboardAnalyses();
  
  // Testa API-endpoint endast om användaren är inloggad
  const userInfoResponse = await fetch('/api/user/info', { credentials: 'include' });
  if (userInfoResponse.ok) {
    await testSavePendingAnalysis();
  } else {
    console.log('⚠️  Hoppar över API-test (du är inte inloggad)');
  }
  
  console.log('✅ Alla tester klara!');
  console.log('\n💡 Tips:');
  console.log('   - Om du ser "INGEN (ej kopplad)" för User ID, betyder det att fakturan inte är kopplad till ditt konto');
  console.log('   - Om du precis skapade konto efter analys, vänta några sekunder och kör testDashboardAnalyses() igen');
}

// Exportera funktioner för manuell körning
window.testBillSaving = {
  sessionStorage: testSessionStorage,
  saveAPI: testSavePendingAnalysis,
  dashboard: testDashboardAnalyses,
  userInfo: testUserInfo,
  all: runAllTests,
};

console.log('✅ Testskript laddat!');
console.log('Kör testBillSaving.all() för att köra alla tester');
console.log('Eller kör individuella tester:');
console.log('  - testBillSaving.sessionStorage()');
console.log('  - testBillSaving.userInfo()');
console.log('  - testBillSaving.dashboard()');
console.log('  - testBillSaving.saveAPI()');
