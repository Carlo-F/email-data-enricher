# Email Data Enricher

Un sistema serverless per estrarre automaticamente i nomi dalle email degli iscritti alla newsletter e arricchire i profili su Brevo.

## 📋 Descrizione

Email Data Enricher analizza gli indirizzi email degli iscritti alla tua newsletter, identifica i nomi propri contenuti negli indirizzi (es. "federica.mullo@gmail.com" → "Federica") e li utilizza per popolare automaticamente il campo FIRSTNAME nei contatti Brevo. Questo consente di personalizzare le comunicazioni email senza richiedere ai tuoi iscritti di compilare campi aggiuntivi durante la registrazione.

## ✨ Funzionalità

- **Estrazione intelligente dei nomi**: Riconosce nomi propri italiani all'interno degli indirizzi email
- **Aggiornamento condizionale**: Aggiorna solo i contatti che non hanno già il campo FIRSTNAME popolato
- **Webhook per nuove iscrizioni**: Si integra con i webhook di Brevo per arricchire automaticamente i nuovi iscritti
- **Elevata precisione**: Evita falsi positivi escludendo nomi troppo corti (< 5 caratteri)
- **Facile da estendere**: Predisposto per l'integrazione con servizi NLP per migliorare ulteriormente l'estrazione

## 🛠️ Tecnologie

- **Node.js** (v20+)
- **Serverless Framework** per deployment su AWS Lambda
- **API Brevo** per gestione contatti newsletter
- **Database di nomi italiani** per il riconoscimento dei nomi

## 📦 Installazione

```bash
# Clona il repository
git clone https://github.com/tuousername/email-data-enricher.git
cd email-data-enricher

# Installa le dipendenze
npm install
```

## ⚙️ Configurazione

1. **Crea un file `.env` nella root del progetto:**

```
BREVO_API_KEY=il_tuo_api_key_di_brevo
STAGE=dev
```

2. **Prepara il database dei nomi**

   Crea una cartella `data` nella root con un file `italian_names.txt` contenente un nome italiano per riga.

## 🚀 Utilizzo

### Test Locale

```bash
# Avvia il server Serverless in locale
npm start

# In un altro terminale, testa l'estrazione
curl -X POST http://localhost:3000/dev/webhook \
  -H "Content-Type: application/json" \
  -d '{"email": "federica.mullo@gmail.com"}'
```

### Script di Test

Il progetto include diversi script di test utili:

```bash
# Testa l'estrazione da una lista di email
node test-emails.js

# Testa l'aggiornamento di un contatto Brevo
node test-brevo-update.js

# Simula la ricezione di un webhook
node test-webhook.js
```

### Deployment su AWS

```bash
# Deploy sull'ambiente specificato in serverless.yml
npm run deploy
```

## 📁 Struttura del Progetto

```
email-data-enricher/
├── src/
│   ├── data/
│   │   └── italian_names.txt     # Database di nomi italiani
│   ├── handlers/             # Handler Lambda
│   │   └── webhook.js        # Gestisce i webhook Brevo
│   ├── services/             # Servizi esterni
│   │   └── brevo.js          # Interazione con API Brevo
│   └── utils/                # Utility
│       ├── databases.js      # Gestione database nomi
│       └── extractor.js      # Estrattore nomi da email
├── tests/                    # Test automatizzati
│   ├── extractor.test.js     # Test per l'estrattore
│   └── samples.js            # Email di esempio per i test
├── .env                      # Variabili d'ambiente (non versionato)
├── package.json              # Dipendenze e script
├── serverless.yml            # Configurazione Serverless Framework
└── README.md                 # Documentazione
```

## 📊 Logica di Estrazione

L'estrattore di nomi:

1. Analizza l'indirizzo email alla ricerca di pattern comuni (nome.cognome, etc.)
2. Cerca corrispondenze con un database di nomi italiani
3. Valida i risultati applicando regole di lunghezza (min. 5 caratteri)
4. Verifica casi speciali mappati direttamente (per maggiore precisione)

```javascript
// Esempio di utilizzo
const { extractFirstName } = require("./src/utils/extractor");
const firstName = extractFirstName("federica.mullo@gmail.com");
console.log(firstName); // Output: 'Federica'
```

## 🔄 Integrazione con Brevo

Il sistema si integra con Brevo in due modi:

1. **API diretta**: Per aggiornamenti manuali o batch di contatti
2. **Webhooks**: Per elaborazione automatica di nuove iscrizioni

### Configurazione Webhook Brevo

1. Accedi alla dashboard Brevo
2. Vai su Automation > Webhooks
3. Crea un nuovo webhook
4. Utilizza l'URL Lambda generato dopo il deployment
5. Seleziona l'evento "Contact added to list"

## ⚠️ Limitazioni Note

- Estrae solo nomi con 5+ caratteri (per evitare falsi positivi)
- Ottimizzato principalmente per nomi italiani
- Non estrae nomi da email con pattern molto insoliti

## 🔮 Sviluppi Futuri

- Integrazione con servizi NLP per migliorare l'estrazione dei nomi corti
- Supporto per database di nomi di altre nazionalità
- Dashboard di monitoraggio per l'efficacia dell'estrazione
- Batch processing per arricchire liste esistenti

## 📄 Licenza

MIT

---

Progetto creato per migliorare le performance delle email tramite personalizzazione del campo nome.
