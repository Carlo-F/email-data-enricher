// bulk-update-contacts.js
const fs = require("fs").promises;
const path = require("path");
const { extractFirstName } = require("../utils/extractor");
const {
  getBrevoContacts,
  getBrevoContact,
  updateBrevoContact,
} = require("../services/brevo");

// Configurazione
const CONFIG = {
  // Elaborazione
  BATCH_SIZE: 25, // Numero di contatti da elaborare contemporaneamente
  INITIAL_PAUSE: 3000, // Pausa iniziale tra batch in ms
  MAX_RETRIES: 3, // Numero massimo di tentativi in caso di errore
  RETRY_DELAY: 5000, // Attesa tra tentativi in ms

  FORCE_UPDATE: false, // Se true, aggiorna anche se FIRSTNAME è già popolato

  // Testing
  TEST_MODE: true, // Se true, elabora solo un subset di contatti
  TEST_CONTACTS_LIMIT: 10, // Numero di contatti da elaborare in modalità test

  // Salvataggio stato e log
  RESULTS_DIR: "../results", // Directory per i file di log e checkpoint
  CHECKPOINT_INTERVAL: 100, // Ogni quanti contatti salvare un checkpoint
  CHECKPOINT_FILE: "checkpoint.json", // Nome del file di checkpoint
  RESULTS_FILE: "results.csv", // Nome del file CSV con i risultati
  RESUME_FROM_CHECKPOINT: true, // Se riprendere dall'ultimo checkpoint
};

// Crea la directory dei risultati se non esiste
async function ensureResultsDir() {
  try {
    await fs.mkdir(CONFIG.RESULTS_DIR, { recursive: true });
    console.log(`Directory ${CONFIG.RESULTS_DIR} creata o già esistente`);
  } catch (error) {
    console.error(
      `Errore nella creazione della directory ${CONFIG.RESULTS_DIR}:`,
      error
    );
    throw error;
  }
}

// Salva i risultati in CSV
async function appendResultsToCSV(results) {
  const csvPath = path.join(CONFIG.RESULTS_DIR, CONFIG.RESULTS_FILE);
  let csvContent = "";

  // Se il file non esiste, aggiungi l'intestazione
  try {
    await fs.access(csvPath);
  } catch {
    csvContent = "email,status,message,nome_estratto,timestamp\n";
  }

  // Aggiungi le righe dei risultati
  for (const r of results) {
    const timestamp = new Date().toISOString();
    const firstName = r.firstName || "";
    const message = (r.message || "").replace(/,/g, ";"); // Evita problemi con le virgole nei messaggi
    csvContent += `${r.email},${r.status},${message},${firstName},${timestamp}\n`;
  }

  await fs.appendFile(csvPath, csvContent);
  return csvPath;
}

// Salva un checkpoint dello stato attuale
async function saveCheckpoint(processed, remaining) {
  const checkpointPath = path.join(CONFIG.RESULTS_DIR, CONFIG.CHECKPOINT_FILE);
  const checkpoint = {
    timestamp: new Date().toISOString(),
    processed: processed.length,
    remaining: remaining.map((c) => c.email),
  };

  await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
  console.log(
    `Checkpoint salvato: ${processed.length} contatti elaborati, ${remaining.length} rimanenti`
  );
  return checkpointPath;
}

// Carica il checkpoint se esiste
async function loadCheckpoint() {
  try {
    const checkpointPath = path.join(
      CONFIG.RESULTS_DIR,
      CONFIG.CHECKPOINT_FILE
    );
    const data = await fs.readFile(checkpointPath, "utf8");
    return JSON.parse(data);
  } catch {
    console.log("Nessun checkpoint trovato, partirò dall'inizio");
    return null;
  }
}

// Elabora un singolo contatto con gestione errori e retry
async function processContact(contact, retryCount = 0) {
  // Verifica che l'email sia valida
  if (!contact.email || contact.email === "undefined") {
    return {
      email: contact.email || "undefined",
      status: "error",
      message: "Email non valida o undefined",
    };
  }

  try {
    // Verifica se FIRSTNAME è già popolato
    const contactInfo = await getBrevoContact(contact.email);

    const hasFirstName =
      contactInfo.attributes &&
      contactInfo.attributes.FIRSTNAME &&
      contactInfo.attributes.FIRSTNAME.trim() !== "";

    // Se FIRSTNAME è già popolato e non forziamo l'aggiornamento, salta
    if (hasFirstName && !CONFIG.FORCE_UPDATE) {
      return {
        email: contact.email,
        status: "skipped",
        message: `FIRSTNAME già popolato (${contactInfo.attributes.FIRSTNAME})`,
      };
    }

    // Estrai il nome dall'email
    const firstName = extractFirstName(contact.email);

    if (!firstName) {
      return {
        email: contact.email,
        status: "skipped",
        message: "Nessun nome estratto",
      };
    }

    // Aggiorna il contatto
    await updateBrevoContact(contact.email, { firstName });
    return {
      email: contact.email,
      status: "updated",
      firstName,
    };
  } catch (error) {
    // Gestione errori con retry
    if (error.response && error.response.status === 429) {
      console.log(
        `Rate limit raggiunto per ${contact.email}, attendo e riprovo...`
      );

      // Se abbiamo ancora tentativi disponibili, facciamo un retry
      if (retryCount < CONFIG.MAX_RETRIES) {
        // Attesa esponenziale
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
        console.log(
          `Retry ${retryCount + 1}/${CONFIG.MAX_RETRIES} tra ${
            delay / 1000
          } secondi`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return processContact(contact, retryCount + 1);
      }
    }

    // Ritorna errore se supera i tentativi o altro tipo di errore
    return {
      email: contact.email,
      status: "error",
      message: `${error.message} (dopo ${retryCount} retry)`,
    };
  }
}

// Elabora un batch di contatti con pausa adattiva
async function processContactBatch(contacts, pauseDuration) {
  console.log(`Elaborazione batch di ${contacts.length} contatti...`);

  const results = [];

  // Elabora i contatti uno alla volta (per un miglior controllo degli errori)
  for (const contact of contacts) {
    console.log(
      `Elaborazione contatto: ${contact.email || "email non definita"}`
    );
    const result = await processContact(contact);

    // Log dettagliato per ogni contatto
    if (result.status === "updated") {
      console.log(`✅ AGGIORNATO: ${result.email} → Nome: ${result.firstName}`);
    } else if (result.status === "skipped") {
      console.log(`⏭️ SALTATO: ${result.email} → Motivo: ${result.message}`);
    } else {
      console.log(`❌ ERRORE: ${result.email} → ${result.message}`);
    }

    results.push(result);

    // Log ogni 10 contatti
    if (results.length % 10 === 0) {
      console.log(
        `Progresso batch: ${results.length}/${contacts.length} completati`
      );
    }

    // Adattiamo la pausa in base ai risultati
    // Se troviamo errori di rate limit, aumentiamo la pausa
    if (result.status === "error" && result.message.includes("429")) {
      pauseDuration = pauseDuration * 1.5; // Aumenta la pausa del 50%
      console.log(
        `Pausa aumentata a ${pauseDuration / 1000} secondi per rate limiting`
      );
    }
  }

  // Salva i risultati
  const csvPath = await appendResultsToCSV(results);
  console.log(`Risultati batch salvati in ${csvPath}`);

  return { results, pauseDuration };
}

// Funzione principale che processa tutti i contatti
async function main() {
  try {
    await ensureResultsDir();

    console.log("Inizio recupero di tutti i contatti Brevo...");
    let allContacts = await getBrevoContacts();
    console.log(`Recuperati ${allContacts.length} contatti totali.`);

    // Modalità test
    if (CONFIG.TEST_MODE) {
      console.log(
        `Modalità TEST: limite di ${CONFIG.TEST_CONTACTS_LIMIT} contatti`
      );
      allContacts = allContacts.slice(0, CONFIG.TEST_CONTACTS_LIMIT);
    }

    // Verifica checkpoint
    let processedContacts = [];
    if (CONFIG.RESUME_FROM_CHECKPOINT) {
      const checkpoint = await loadCheckpoint();
      if (
        checkpoint &&
        checkpoint.remaining &&
        checkpoint.remaining.length > 0
      ) {
        const remainingEmails = new Set(checkpoint.remaining);
        allContacts = allContacts.filter((c) => remainingEmails.has(c.email));
        console.log(
          `Ripresa da checkpoint: ${allContacts.length} contatti rimanenti`
        );
      }
    }

    // Dividi contatti in batch
    const batches = [];
    for (let i = 0; i < allContacts.length; i += CONFIG.BATCH_SIZE) {
      batches.push(allContacts.slice(i, i + CONFIG.BATCH_SIZE));
    }

    console.log(`Creati ${batches.length} batch da processare.`);

    // Statistiche
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Pausa iniziale tra batch
    let currentPauseDuration = CONFIG.INITIAL_PAUSE;

    // Elabora i batch in sequenza con pause
    for (let i = 0; i < batches.length; i++) {
      console.log(`Elaborazione batch ${i + 1}/${batches.length}...`);

      const { results, pauseDuration } = await processContactBatch(
        batches[i],
        currentPauseDuration
      );
      currentPauseDuration = pauseDuration; // Aggiorna la durata della pausa per il prossimo batch

      // Aggiorna statistiche
      results.forEach((result) => {
        if (result.status === "updated") updated++;
        else if (result.status === "skipped") skipped++;
        else errors++;

        processedContacts.push(result);
      });

      console.log(
        `Progresso: ${updated} aggiornati, ${skipped} saltati, ${errors} errori`
      );

      // Salva checkpoint periodicamente
      if (
        processedContacts.length % CONFIG.CHECKPOINT_INTERVAL === 0 ||
        i === batches.length - 1
      ) {
        const remainingContacts = allContacts.slice(
          (i + 1) * CONFIG.BATCH_SIZE
        );
        await saveCheckpoint(processedContacts, remainingContacts);
      }

      // Pausa prima del prossimo batch
      if (i < batches.length - 1) {
        console.log(`Pausa di ${currentPauseDuration / 1000} secondi...`);
        await new Promise((resolve) =>
          setTimeout(resolve, currentPauseDuration)
        );
      }
    }

    console.log(
      `Completato! Totale: ${updated} aggiornati, ${skipped} saltati, ${errors} errori`
    );
    console.log(
      `Risultati completi salvati in ${path.join(
        CONFIG.RESULTS_DIR,
        CONFIG.RESULTS_FILE
      )}`
    );
  } catch (error) {
    console.error("Errore generale:", error);
  }
}

// Avvia lo script
main();
