const { extractFirstName } = require('../utils/extractor');
const { getBrevoContact, updateBrevoContact } = require('../services/brevo');

/**
 * Handler per webhook Brevo
 */
async function handler(event, context) {
  try {
    console.log('Ricevuto webhook:', event.body);
    
    // Estrai dati dal webhook di Brevo
    const webhookData = JSON.parse(event.body);
    const email = webhookData.email;
    
    if (!email) {
      console.error('Email mancante nel payload');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Email mancante nel payload' })
      };
    }
    
    // Verifica evento (opzionale)
    const eventType = webhookData.event;
    console.log(`Tipo evento: ${eventType}`);
    
    // Recupera i dettagli completi del contatto da Brevo
    console.log(`Recupero dettagli contatto per ${email}...`);
    const contactInfo = await getBrevoContact(email);
    
    // Se il contatto non esiste, segnaliamo un errore
    if (!contactInfo) {
      console.log(`Contatto ${email} non trovato su Brevo.`);
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false, 
          message: 'Contatto non trovato' 
        })
      };
    }
    
    // Verifica se FIRSTNAME è già popolato
    const hasFirstName = contactInfo.attributes && 
                        contactInfo.attributes.FIRSTNAME && 
                        contactInfo.attributes.FIRSTNAME.trim() !== '';
    
    if (hasFirstName) {
      console.log(`Il contatto ${email} ha già il campo FIRSTNAME popolato: "${contactInfo.attributes.FIRSTNAME}". Aggiornamento saltato.`);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: true, 
          status: "skipped",
          message: "FIRSTNAME già popolato",
          email,
          existingName: contactInfo.attributes.FIRSTNAME
        })
      };
    }
    
    // Estrai il nome dall'email
    const firstName = extractFirstName(email);
    console.log(`Nome estratto da ${email}: ${firstName || 'Nessun nome riconosciuto'}`);
    
    // Aggiorna il contatto su Brevo se abbiamo trovato un nome
    let updateResult = null;
    if (firstName) {
      updateResult = await updateBrevoContact(email, { firstName });
      console.log('Risultato aggiornamento:', updateResult);
    } else {
      console.log('Nessun nome estratto, aggiornamento non effettuato.');
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true, 
        status: firstName ? "updated" : "skipped",
        message: firstName ? "FIRSTNAME aggiornato" : "Nessun nome estratto",
        email, 
        extractedInfo: { firstName },
        updateResult
      })
    };
  } catch (error) {
    console.error('Errore nel processare il webhook:', error.message);
    if (error.response) {
      console.error('Dettagli errore:', JSON.stringify(error.response.data));
    }
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Errore interno del server',
        message: error.message
      })
    };
  }
}

module.exports = { handler };