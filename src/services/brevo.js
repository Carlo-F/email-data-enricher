const axios = require('axios');
require('dotenv').config();

/**
 * Ottiene i dettagli di un contatto da Brevo
 * @param {string} email - Email del contatto
 * @returns {Promise<Object|null>} Dettagli del contatto o null se non trovato
 */
async function getBrevoContact(email) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY non configurata correttamente');
  }
  
  try {
    const encodedEmail = encodeURIComponent(email);
    const url = `https://api.brevo.com/v3/contacts/${encodedEmail}`;
    
    console.log(`Recupero informazioni contatto ${email} da Brevo...`);
    
    const response = await axios({
      method: 'get',
      url: url,
      headers: {
        'api-key': BREVO_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Informazioni contatto recuperate con successo.`);
    return response.data;
  } catch (error) {
    // Se il contatto non esiste, Brevo restituisce un errore 404
    if (error.response && error.response.status === 404) {
      console.log(`Contatto ${email} non trovato su Brevo.`);
      return null;
    }
    
    console.error('Errore nel recupero informazioni contatto:', error.message);
    if (error.response) {
      console.error('Dettagli errore Brevo:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

async function getBrevoContacts(limit = 500, offset = 0, allContacts = []) {
  try {
    console.log(`Recupero contatti: offset=${offset}, limit=${limit}`);
    const response = await axios.get('https://api.brevo.com/v3/contacts', {
      headers: { 'api-key': process.env.BREVO_API_KEY },
      params: { limit, offset }
    });
    
    const newContacts = response.data.contacts || [];
    
    // Filtra contatti con email valide
    const validContacts = newContacts.filter(contact => {
      if (!contact.email || contact.email === 'undefined') {
        console.log(`⚠️ Contatto ignorato: email non valida o undefined`);
        return false;
      }
      return true;
    });
    
    const contacts = [...allContacts, ...validContacts];
    
    console.log(`Recuperati ${newContacts.length} contatti. Totale finora: ${contacts.length}/${response.data.total}`);
    
    // Se ci sono più contatti, recupera la pagina successiva
    if (response.data.count + offset < response.data.total) {
      // Breve pausa per evitare rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getBrevoContacts(limit, offset + limit, contacts);
    }
    
    return contacts;
  } catch (error) {
    console.error('Errore nel recupero dei contatti:', error.message);
    if (error.response) {
      console.error('Dettagli errore API:', error.response.data);
      
      // In caso di rate limiting, attendi e riprova
      if (error.response.status === 429) {
        console.log('Rate limit raggiunto, attesa di 60 secondi...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        return getBrevoContacts(limit, offset, allContacts);
      }
    }
    throw error;
  }
}

/**
 * Aggiorna un contatto su Brevo
 * @param {string} email - Email del contatto
 * @param {Object} data - Dati da aggiornare (firstName, lastName, ecc.)
 */
async function updateBrevoContact(email, data) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY non configurata nelle variabili d\'ambiente');
  }
  
  try {
    const encodedEmail = encodeURIComponent(email);
    const url = `https://api.brevo.com/v3/contacts/${encodedEmail}`;
    
    console.log(`Recupero informazioni contatto ${email} da Brevo...`);
    
    const response = await axios({
      method: 'get',
      url: url,
      headers: {
        'api-key': BREVO_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Informazioni contatto recuperate con successo.`);
    return response.data;
  } catch (error) {
    // Se il contatto non esiste, Brevo restituisce un errore 404
    if (error.response && error.response.status === 404) {
      console.log(`Contatto ${email} non trovato su Brevo.`);
      return null;
    }
    
    console.error('Errore nel recupero informazioni contatto:', error.message);
    if (error.response) {
      console.error('Dettagli errore Brevo:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

/**
 * Aggiorna un contatto su Brevo SOLO se il campo FIRSTNAME è vuoto
 * @param {string} email - Email del contatto
 * @param {Object} data - Dati da aggiornare (firstName, lastName, ecc.)
 */
async function updateBrevoContact(email, data) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY || "inserisci_qui_la_tua_api_key_brevo";
  
  if (!BREVO_API_KEY || BREVO_API_KEY === "inserisci_qui_la_tua_api_key_brevo") {
    throw new Error('BREVO_API_KEY non configurata correttamente');
  }
  
  try {
    // Verifica se l'email è valida
    if (!email || typeof email !== 'string') {
      throw new Error('Email non valida: ' + email);
    }
    
    // Verifica se il contatto esiste e ottieni i suoi dati attuali
    const contactInfo = await getBrevoContact(email);
    
    // Se il contatto non esiste, non possiamo aggiornarlo
    if (!contactInfo) {
      console.log(`Impossibile aggiornare: contatto ${email} non esistente su Brevo.`);
      return null;
    }
    
    // Verifica se FIRSTNAME è già popolato
    const hasFirstName = contactInfo.attributes && 
                        contactInfo.attributes.FIRSTNAME && 
                        contactInfo.attributes.FIRSTNAME.trim() !== '';
    
    if (hasFirstName) {
      console.log(`Il contatto ${email} ha già il campo FIRSTNAME popolato: "${contactInfo.attributes.FIRSTNAME}". Aggiornamento saltato.`);
      return {
        status: "skipped",
        message: "FIRSTNAME già popolato",
        existingValue: contactInfo.attributes.FIRSTNAME
      };
    }
    
    // Prepara gli attributi da aggiornare
    const attributes = {};
    if (data.firstName) attributes.FIRSTNAME = data.firstName;
    
    // Aggiorna il contatto solo se abbiamo attributi da aggiornare
    if (Object.keys(attributes).length > 0) {
      const encodedEmail = encodeURIComponent(email);
      const url = `https://api.brevo.com/v3/contacts/${encodedEmail}`;
      
      const requestBody = {
        attributes: attributes
      };
      
      console.log(`Aggiornamento contatto ${email} su Brevo con FIRSTNAME: ${data.firstName}`);
      
      const response = await axios({
        method: 'put',
        url: url,
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: requestBody
      });
      
      console.log(`Contatto ${email} aggiornato con successo, status:`, response.status);
      return {
        status: "updated",
        message: "FIRSTNAME aggiornato",
        newValue: data.firstName
      };
    } else {
      console.log(`Nessun attributo da aggiornare per ${email}`);
      return {
        status: "skipped",
        message: "Nessun attributo da aggiornare"
      };
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento del contatto:', error.message);
    if (error.response) {
      console.error('Dettagli errore Brevo:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

module.exports = {
  getBrevoContact,
  getBrevoContacts,
  updateBrevoContact
};