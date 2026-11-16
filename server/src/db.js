'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('parent', 'specialist', 'child'))
);
CREATE TABLE IF NOT EXISTS children (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  parent_user_id INTEGER NOT NULL REFERENCES users(id),
  display_name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS specialist_links (
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  specialist_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialist_type TEXT NOT NULL CHECK (specialist_type IN
    ('teacher','psychologist','doctor','special_education_teacher','coach')),
  created_at TEXT NOT NULL,
  PRIMARY KEY(child_id, specialist_user_id)
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  created_by_user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK(ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assigned_by_user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  development_area TEXT NOT NULL CHECK (development_area IN
    ('cognitive','social_emotional','language','motor','self_care')),
  due_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed')),
  completed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_links_specialist ON specialist_links(specialist_user_id);
CREATE INDEX IF NOT EXISTS idx_events_child_start ON events(child_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_tasks_child_due ON tasks(child_id, due_at);
`;

function initSchema(db) { db.exec(SCHEMA); return db; }

function openDatabase(filename = process.env.DB_FILE || './data/development.sqlite') {
  const full = path.resolve(process.cwd(), filename);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const db = new DatabaseSync(full);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  initSchema(db);
  return db;
}

module.exports = { openDatabase, initSchema };
