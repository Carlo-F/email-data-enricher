const fs = require('fs');
const path = require('path');

/**
 * Carica il database dei nomi italiani
 * @returns {Set} Set di nomi italiani
 */
function loadNamesDatabase() {
  try {
    const filePath = path.join(__dirname, '../data', 'italian_names.txt');
    console.log(`Caricamento database nomi da ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    return new Set(
      content
        .split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line.length > 0)
    );
  } catch (error) {
    console.error(`Errore nel caricamento del database dei nomi:`, error);
    console.log('Utilizzo database di nomi di backup.');
    return fallbackNamesDatabase();
  }
}

/**
 * Database di nomi di fallback in caso di errore di caricamento
 * @returns {Set} Set di nomi italiani comuni
 */
function fallbackNamesDatabase() {
  // Database minimo di nomi italiani comuni per garantire funzionalità di base
  return new Set([
    "mario", "giuseppe", "antonio", "giovanni", "francesco", "luigi", "andrea", 
    "roberto", "stefano", "paolo", "giorgio", "matteo", "federico", "carlo", 
    "lorenzo", "marco", "luca", "massimo", "valerio", "vincenzo", "vince",
    "alberto", "alessio", "angelo", "alessandro", "claudio", "daniele", "david",
    "emanuele", "fabio", "filippo", "gabriele", "gianfranco", "gianmarco",
    "iacopo", "ignazio", "leonardo", "nicola", "pietro", "riccardo", "salvatore",
    "simone", "tommaso", "umberto", "vittorio",
    
    "maria", "anna", "lucia", "giovanna", "rosa", "angela", "sofia", "giulia", 
    "francesca", "laura", "alessandra", "elena", "valentina", "martina", "chiara", 
    "simona", "monica", "alessia", "cristina", "elisa", "michela", "genny", "rita", 
    "margherita", "sabrina", "veronique", "catia", "federica", "elisabetta", "eli",
    "rossella", "natalia", "cinzia", "paola", "morgana", "beatrice", "carolina",
    "daria", "eleonora", "fiamma", "giada", "ilaria", "alice", "letizia", "marica",
    "noemi", "ombretta", "patrizia", "rachele", "sara", "teresa", "ursula", "viola",
    "roberta", "serena", "silvia", "tania", "tiziana", "vanessa", "stella"
  ]);
}

// Mappatura da diminutivi ai nomi completi
const diminutiveToFullName = {
  "ale": "alessandro",
  "aly": "alessandra",
  "bea": "beatrice",
  "beppe": "giuseppe",
  "caro": "carolina",
  "cri": "cristina",
  "dani": "daniele",
  "eli": "elisabetta",
  "ele": "elena",
  "fede": "federica",
  "francy": "francesca",
  "gabri": "gabriele",
  "gian": "gianni",
  "gianni": "giovanni",
  "giò": "giovanni",
  "giuly": "giulia",
  "ila": "ilaria",
  "kekka": "francesca",
  "laura": "laura",
  "leo": "leonardo",
  "lori": "lorenzo",
  "mari": "maria",
  "matte": "matteo",
  "miki": "michele",
  "moni": "monica",
  "morgana": "morgana",
  "naty": "natalia",
  "nico": "nicola",
  "nino": "antonino",
  "patty": "patrizia",
  "pier": "pierluigi",
  "pino": "giuseppe",
  "rico": "riccardo",
  "rino": "salvatore",
  "roby": "roberto",
  "ross": "rossella",
  "sandro": "alessandro",
  "sara": "sara",
  "simo": "simona",
  "sofi": "sofia",
  "stefy": "stefania",
  "tere": "teresa",
  "tina": "cristina",
  "tino": "valentino",
  "tom": "tommaso",
  "tony": "antonio",
  "umb": "umberto",
  "vale": "valentina",
  "vany": "vanessa",
  "vitto": "vittorio"
};

// Carica il database dei nomi una sola volta all'avvio del modulo
const italianNames = loadNamesDatabase();
console.log(`Database nomi italiani caricato: ${italianNames.size} nomi`);

module.exports = {
  isItalianName: (name) => {
    if (!name) return false;
    return italianNames.has(name.toLowerCase().trim());
  },
  getNamesCount: () => italianNames.size,
  isDiminutive: (name) => {
    if (!name) return false;
    return !!diminutiveToFullName[name.toLowerCase().trim()];
  },
  getFullName: (diminutive) => {
    if (!diminutive) return null;
    const fullName = diminutiveToFullName[diminutive.toLowerCase().trim()];
    return fullName ? fullName : null;
  }
};