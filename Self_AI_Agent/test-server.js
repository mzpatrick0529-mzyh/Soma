const express = require('express');
const app = express();
app.get('/health', (req, res) => res.send('ok'));
app.listen(8787, '127.0.0.1', () => {
  console.log('Test server listening on http://127.0.0.1:8787');
});
