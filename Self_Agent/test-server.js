// Deprecated: One-off dev script has been removed from active use.
// Intentionally prevented from running to avoid confusion.
throw new Error("[Deprecated] Self_AI_Agent/test-server.js has been removed. Use npm --prefix Self_AI_Agent run dev to start the server.");

const express = require('express');
const app = express();
app.get('/health', (req, res) => res.send('ok'));
app.listen(8787, '127.0.0.1', () => {
  console.log('Test server listening on http://127.0.0.1:8787');
});
