const { extractFirstName } = require('../utils/extractor');
const sampleEmails = require('./samples');

// Funzione per stampare in formato tabella i risultati
function printTable(results) {
  console.log('\n====================================================');
  console.log('| Email                       | Nome           |');
  console.log('====================================================');
  
  results.forEach(({ email, firstName }) => {
    console.log(
      `| ${email.padEnd(28)} | ${(firstName || '').padEnd(15)} |`
    );
  });
  
  console.log('====================================================\n');
}

// Calcola statistiche di estrazione
function calculateStats(results) {
  const total = results.length;
  let namesExtracted = 0;
  
  results.forEach(({ firstName }) => {
    if (firstName) namesExtracted++;
  });
  
  return {
    total,
    namesPercentage: (namesExtracted / total * 100).toFixed(2),
    namesExtracted
  };
}

// Test principale
test('Analisi del campione di email per estrazione nomi', () => {
  const results = sampleEmails.map(email => ({
    email,
    firstName: extractFirstName(email)
  }));
  
  // Stampa i risultati in formato tabella
  printTable(results);
  
  // Calcola e stampa statistiche
  const stats = calculateStats(results);
  console.log(`Statistiche di Estrazione:`);
  console.log(`- Totale email: ${stats.total}`);
  console.log(`- Nomi estratti: ${stats.namesExtracted} (${stats.namesPercentage}%)`);
  
  // Semplice test per verificare che non ci siano errori
  expect(results.length).toBe(sampleEmails.length);
  
  // Test addizionale per verificare un caso noto
  const testEmail = "federicamullo@gmail.com";
  const testResult = extractFirstName(testEmail);
  expect(testResult).toBe("Federica");
});