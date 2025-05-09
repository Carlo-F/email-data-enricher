const { isItalianName } = require("./databases");

/**
 * Estrae solo il nome dalla email, ignorando cognome e altri dati
 * @param {string} email - Indirizzo email completo
 * @returns {string|null} Il nome estratto o null
 */
function extractFirstName(email) {
  email = email.toLowerCase().trim();
  const [username, domain] = email.split("@");

  // MAPPATURA DIRETTA - Casi specifici noti problematici
  const directMapping = {
    rosannapa55: "Rosanna",
    elisa: "Elisa",
  };

  // Se c'è una mappatura diretta, usala
  if (directMapping[username]) {
    return directMapping[username];
  }

  let extractedName = null;

  // PATTERN 1: nome.cognome o cognome.nome
  if (username.includes(".")) {
    const parts = username.split(".");

    for (let i = 0; i < parts.length; i++) {
      const cleanPart = parts[i].replace(/[0-9]/g, "");

      // *** CONTROLLO LUNGHEZZA: solo nomi >= 5 caratteri ***
      if (cleanPart.length >= 5 && isItalianName(cleanPart)) {
        return capitalizeItalianName(cleanPart);
      }
    }
  }

  // PATTERN 2: iniziale.nome (es. g.catia)
  const initPattern = /^[a-z]\.([a-z]+)/;
  const initMatch = username.match(initPattern);
  if (initMatch && initMatch[1]) {
    const namePart = initMatch[1].replace(/[0-9]/g, "");

    // *** CONTROLLO LUNGHEZZA: solo nomi >= 5 caratteri ***
    if (namePart.length >= 5 && isItalianName(namePart)) {
      return capitalizeItalianName(namePart);
    }
  }

  // PATTERN 3: nome+numero o nome+cognome
  const cleanUsername = username.replace(/[0-9_\.\-]/g, "");

  if (cleanUsername.length >= 5) {
    // Cerca nomi di 5+ caratteri all'inizio dell'username
    for (let len = Math.min(cleanUsername.length, 12); len >= 5; len--) {
      const potentialName = cleanUsername.substring(0, len);
      if (isItalianName(potentialName)) {
        return capitalizeItalianName(potentialName);
      }
    }

    // Cerca nomi di 5+ caratteri ovunque nell'username
    for (let len = Math.min(cleanUsername.length, 12); len >= 5; len--) {
      for (let i = 1; i <= cleanUsername.length - len; i++) {
        const potentialName = cleanUsername.substring(i, i + len);
        if (isItalianName(potentialName)) {
          return capitalizeItalianName(potentialName);
        }
      }
    }
  }

  return extractedName;
}

/**
 * Funzione helper per capitalizzare nomi italiani
 * @param {string} str - Stringa da capitalizzare
 * @returns {string|null} Stringa capitalizzata o null
 */
function capitalizeItalianName(str) {
  if (!str) return null;

  // Ignora casi con solo numeri o stringhe molto corte
  if (/^\d+$/.test(str) || str.length < 2) return null;

  // Gestione casi con apostrofo (es. D'Amico)
  if (str.includes("'")) {
    const parts = str.split("'");
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[0].slice(1).toLowerCase() +
      "'" +
      parts[1].charAt(0).toUpperCase() +
      parts[1].slice(1).toLowerCase()
    );
  }

  // Gestione nomi composti italiani comuni
  if (str.includes(" ")) {
    return str
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = {
  extractFirstName,
  capitalizeItalianName,
};
