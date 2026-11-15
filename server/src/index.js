'use strict';
const { openDatabase } = require('./db');
const { createApp } = require('./app');

try {
  const db = openDatabase();
  const count = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (!count) console.warn('No demo users found. Run "npm run seed" from the repository root.');
  const port = Number(process.env.PORT) || 3001;
  createApp(db).listen(port, '127.0.0.1', () => {
    console.log(`SENG383 API v0.1 listening at http://127.0.0.1:${port}`);
  });
} catch (error) {
  console.error('Could not start API:', error.message);
  process.exitCode = 1;
}
