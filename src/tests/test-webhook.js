// test-webhook.js
const { handler } = require('../handlers/webhook');

// Simula un evento webhook da Brevo
async function simulateWebhook(email) {
  console.log(`\n=== SIMULAZIONE WEBHOOK BREVO ===\n`);
  console.log(`Email: ${email}`);
  
  // Crea un evento webhook realistico basato sulla documentazione Brevo
  const event = {
    body: JSON.stringify({
      event: "list_addition",
      email: email,
      id: 12345,
      key: "abcdef123456",
      date: "2023-05-24, 10:14:22",
      ts: 1684915662,
      list_id: [3, 7]
    })
  };
  
  try {
    // Chiamata all'handler del webhook
    console.log('Chiamata al webhook handler...\n');
    const response = await handler(event, {});
    
    // Visualizzazione risultato
    console.log('Risposta statusCode:', response.statusCode);
    const body = JSON.parse(response.body);
    console.log('\nRisposta body:');
    console.log(JSON.stringify(body, null, 2));
    
    // Riassunto dell'operazione
    if (body.status === "updated") {
      console.log('\n✅ Contatto aggiornato con successo!');
    } else if (body.status === "skipped") {
      console.log('\n⏭️ Aggiornamento saltato: ' + body.message);
    }
  } catch (error) {
    console.error('Errore durante la simulazione:', error);
  }
  
  console.log(`\n=== SIMULAZIONE COMPLETATA ===\n`);
}

// Email da testare
const testEmail = "carlofeniello@hotmail.it"; // Cambia con una email di test

// Avvia il test
simulateWebhook(testEmail);