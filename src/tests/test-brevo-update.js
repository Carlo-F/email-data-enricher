const { getBrevoContact, updateBrevoContact } = require('../services/brevo');
const { extractFirstName } = require('../utils/extractor');

// Email di un contatto esistente nella tua lista Brevo
const targetEmail = "carlofeniello@hotmail.it"; // Sostituisci con l'email da testare

// Estrai il nome e aggiorna il contatto
async function testConditionalUpdate() {
  console.log(`\n=== TEST AGGIORNAMENTO CONDIZIONALE BREVO ===\n`);
  console.log(`Email di test: ${targetEmail}`);
  
  try {
    // Ottieni info attuali del contatto
    console.log('Recupero informazioni attuali del contatto...');
    const contactInfo = await getBrevoContact(targetEmail);
    
    if (!contactInfo) {
      console.log('Contatto non trovato su Brevo.');
      return;
    }
    
    // Mostra i dati attuali
    console.log('\nDati attuali:');
    console.log('- Email:', contactInfo.email);
    console.log('- FIRSTNAME:', contactInfo.attributes?.FIRSTNAME || 'Non impostato');
    console.log('- LASTNAME:', contactInfo.attributes?.LASTNAME || 'Non impostato');
    
    // Estrai il nome dall'email
    const firstName = extractFirstName(targetEmail);
    console.log(`\nNome estratto dall'email: ${firstName || 'Nessun nome riconosciuto'}`);
    
    if (firstName) {
      // Aggiorna il contatto su Brevo (solo se FIRSTNAME è vuoto)
      console.log('\nTentativo di aggiornamento condizionale...');
      const result = await updateBrevoContact(targetEmail, { firstName });
      
      console.log('\nRisultato aggiornamento:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.status === "updated") {
        console.log('\n✅ Contatto aggiornato con successo!');
      } else if (result.status === "skipped") {
        console.log('\n⏭️ Aggiornamento saltato: ' + result.message);
      }
    } else {
      console.log('Nessun nome estratto dall\'email, aggiornamento non necessario.');
    }
  } catch (error) {
    console.error('Errore durante l\'aggiornamento:', error.message);
  }
  
  console.log(`\n=== TEST COMPLETATO ===\n`);
}

// Esegui il test
testConditionalUpdate();