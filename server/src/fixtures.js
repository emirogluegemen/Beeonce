'use strict';
const { hashPassword } = require('./security');
const { mondayUTC } = require('./validation');
const PASSWORD = 'Demo1234!';

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function seedDemo(db, now = new Date()) {
  const week = mondayUTC(now);
  const users = [
    [1, 'parent@demo.test', 'Arda Demo', 'parent'],
    [2, 'child@demo.test', 'Deniz Demo', 'child'],
    [3, 'teacher@demo.test', 'Elif Demo', 'specialist'],
    [4, 'doctor@demo.test', 'Can Demo', 'specialist'],
    [5, 'otherparent@demo.test', 'Mert Example', 'parent'],
    [6, 'otherchild@demo.test', 'Ada Example', 'child']
  ];
  const insertUser = db.prepare('INSERT INTO users (id,email,display_name,role,password_hash) VALUES (?,?,?,?,?)');
  const insertChild = db.prepare('INSERT INTO children (id,user_id,parent_user_id,display_name) VALUES (?,?,?,?)');
  const insertLink = db.prepare('INSERT INTO specialist_links (child_id,specialist_user_id,specialist_type,created_at) VALUES (?,?,?,?)');
  const insertEvent = db.prepare(`INSERT INTO events
    (child_id,created_by_user_id,title,description,starts_at,ends_at,created_at)
    VALUES (?,?,?,?,?,?,?)`);
  const insertTask = db.prepare(`INSERT INTO tasks
    (child_id,assigned_by_user_id,title,description,development_area,due_at,status,completed_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  const stamp = now.toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    // Seed only creates fictional people. In tests, begin with a new in-memory DB.
    for (const [id, email, name, role] of users) insertUser.run(id, email, name, role, hashPassword(PASSWORD));
    insertChild.run(1, 2, 1, 'Deniz Demo');
    insertChild.run(2, 6, 5, 'Ada Example');
    insertLink.run(1, 3, 'teacher', stamp);
    insertEvent.run(1, 1, 'Reading session', 'Read together for twenty minutes', `${addDays(week, 1)}T10:00:00.000Z`, `${addDays(week, 1)}T10:30:00.000Z`, stamp);
    insertEvent.run(1, 3, 'Creative play', 'Creative activity with the teacher', `${addDays(week, 3)}T14:00:00.000Z`, `${addDays(week, 3)}T15:00:00.000Z`, stamp);
    insertEvent.run(2, 5, 'Family outing', 'A separate family\'s private event', `${addDays(week, 2)}T09:00:00.000Z`, `${addDays(week, 2)}T11:00:00.000Z`, stamp);
    insertTask.run(1, 1, 'Read a short story', 'Read a story and talk about its characters.', 'language', addDays(week, 1), 'pending', null, stamp);
    insertTask.run(1, 3, 'Practice drawing shapes', 'Draw a circle, square and triangle.', 'motor', addDays(week, 2), 'pending', null, stamp);
    insertTask.run(1, 1, 'Pack the school bag', 'Prepare tomorrow\'s school bag.', 'self_care', addDays(week, 4), 'completed', stamp, stamp);
    insertTask.run(2, 5, 'Private child task', 'Only visible to the second family.', 'cognitive', addDays(week, 2), 'pending', null, stamp);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
module.exports = { seedDemo, PASSWORD, addDays };
