'use strict';
const { openDatabase } = require('./db');
const { seedDemo, PASSWORD } = require('./fixtures');
const db = openDatabase();
// Explicitly reset the demo DB. Never use this script with real-person data.
db.exec('DELETE FROM tasks; DELETE FROM events; DELETE FROM specialist_links; DELETE FROM children; DELETE FROM users;');
seedDemo(db);
db.close();
console.log('Seeded fictional demo accounts (all passwords: ' + PASSWORD + ')');
console.log('parent@demo.test / child@demo.test / teacher@demo.test / doctor@demo.test');
console.log('otherparent@demo.test / otherchild@demo.test');
