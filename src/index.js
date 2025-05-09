const { handleWebhook } = require('./handlers/webhook');

// Funzione Lambda principale
exports.webhookHandler = async (event, context) => {
  return handleWebhook(event);
};

// Per uso locale
if (require.main === module) {
  const testEmail = "test.user@example.com";
  console.log(`Test locale con email: ${testEmail}`);
  
  const mockEvent = {
    body: JSON.stringify({
      email: testEmail
    })
  };
  
  handleWebhook(mockEvent)
    .then(response => console.log('Risposta:', response))
    .catch(err => console.error('Errore:', err));
}