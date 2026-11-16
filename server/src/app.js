'use strict';
const express = require('express');
const { verifyPassword, createToken } = require('./security');
const { authenticate, requireRole, childAccess, ownerOnly } = require('./authorization');
const { TYPES, AREAS, requiredString, optionalString, choice, validDateOnly, validDateTime, weekBounds } = require('./validation');

function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));
  const auth = authenticate(db);
  const access = childAccess(db, 'read');
  const edit = childAccess(db, 'write');
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', release: 'v0.1' }));

  app.post('/api/auth/login', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    if (!email || typeof password !== 'string') return res.status(400).json({ error: 'Email and password required' });
    const user = db.prepare('SELECT id, email, display_name, role, password_hash FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
    const { password_hash: _private, ...publicUser } = user;
    return res.json({ token: createToken(user), user: publicUser });
  });
  app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));

  app.get('/api/children', auth, requireRole('parent', 'specialist'), (req, res) => {
    const children = req.user.role === 'parent'
      ? db.prepare('SELECT id, display_name AS displayName FROM children WHERE parent_user_id = ? ORDER BY id').all(req.user.id)
      : db.prepare(`SELECT c.id, c.display_name AS displayName FROM children c
          JOIN specialist_links sl ON sl.child_id = c.id WHERE sl.specialist_user_id = ? ORDER BY c.id`).all(req.user.id);
    res.json({ children });
  });
  app.get('/api/child/me', auth, requireRole('child'), (req, res) => {
    const child = db.prepare('SELECT id, display_name AS displayName FROM children WHERE user_id = ?').get(req.user.id);
    if (!child) return res.status(404).json({ error: 'No child profile is linked to this account' });
    return res.json({ child });
  });

  // All specialist-link operations require current parent ownership. No email invites.
  app.get('/api/children/:childId/specialists', auth, access, ownerOnly, (req, res) => {
    const specialists = db.prepare(`SELECT u.id, u.email, u.display_name AS displayName,
      sl.specialist_type AS specialistType, sl.created_at AS linkedAt
      FROM specialist_links sl JOIN users u ON u.id = sl.specialist_user_id
      WHERE sl.child_id = ? ORDER BY u.display_name`).all(req.child.id);
    res.json({ specialists });
  });
  app.post('/api/children/:childId/specialists', auth, edit, ownerOnly, (req, res) => {
    const email = requiredString(req.body?.email, 'email', 254).toLowerCase();
    const specialistType = choice(req.body?.specialistType, TYPES, 'specialistType');
    const specialist = db.prepare("SELECT id FROM users WHERE email = ? AND role = 'specialist'").get(email);
    if (!specialist) return res.status(404).json({ error: 'No registered specialist with that email' });
    const existing = db.prepare('SELECT 1 FROM specialist_links WHERE child_id = ? AND specialist_user_id = ?').get(req.child.id, specialist.id);
    if (existing) return res.status(409).json({ error: 'Specialist is already linked' });
    db.prepare('INSERT INTO specialist_links (child_id, specialist_user_id, specialist_type, created_at) VALUES (?, ?, ?, ?)')
      .run(req.child.id, specialist.id, specialistType, new Date().toISOString());
    return res.status(201).json({ specialistId: specialist.id, specialistType });
  });
  app.delete('/api/children/:childId/specialists/:userId', auth, edit, ownerOnly, (req, res) => {
    const id = Number(req.params.userId);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(404).json({ error: 'Link not found' });
    const result = db.prepare('DELETE FROM specialist_links WHERE child_id = ? AND specialist_user_id = ?').run(req.child.id, id);
    if (!result.changes) return res.status(404).json({ error: 'Link not found' });
    return res.status(204).end();
  });

  app.get('/api/children/:childId/events', auth, access, (req, res) => {
    const bounds = req.query.weekStart ? weekBounds(req.query.weekStart) : null;
    const sql = `SELECT e.id, e.child_id AS childId, e.title, e.description,
      e.starts_at AS startsAt, e.ends_at AS endsAt, e.created_at AS createdAt,
      u.display_name AS createdByName FROM events e JOIN users u ON u.id = e.created_by_user_id
      WHERE e.child_id = ? ${bounds ? 'AND e.starts_at < ? AND e.ends_at > ?' : ''} ORDER BY e.starts_at, e.id`;
    const events = bounds
      ? db.prepare(sql).all(req.child.id, bounds.end, bounds.start)
      : db.prepare(sql).all(req.child.id);
    res.json({ events });
  });
  app.post('/api/children/:childId/events', auth, edit, (req, res) => {
    const title = requiredString(req.body?.title, 'title');
    const description = optionalString(req.body?.description, 'description');
    const startsAt = validDateTime(req.body?.startsAt, 'startsAt');
    const endsAt = validDateTime(req.body?.endsAt, 'endsAt');
    if (endsAt <= startsAt) return res.status(400).json({ error: 'Event end must be after start' });
    const now = new Date().toISOString();
    const result = db.prepare(`INSERT INTO events
      (child_id, created_by_user_id, title, description, starts_at, ends_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(req.child.id, req.user.id, title, description, startsAt, endsAt, now);
    return res.status(201).json({ event: { id: Number(result.lastInsertRowid), childId: req.child.id, title, description, startsAt, endsAt, createdAt: now, createdByName: req.user.display_name } });
  });

  app.get('/api/children/:childId/tasks', auth, access, (req, res) => {
    const bounds = req.query.weekStart ? weekBounds(req.query.weekStart) : null;
    if (req.query.assignedBy && req.query.assignedBy !== 'me') return res.status(400).json({ error: 'Invalid assignedBy filter' });
    if (req.query.assignedBy === 'me' && req.user.role === 'child') return res.status(403).json({ error: 'Children cannot filter by assigner' });
    let sql = `SELECT t.id, t.child_id AS childId, t.title, t.description,
      t.development_area AS developmentArea, t.due_at AS dueAt, t.status,
      t.completed_at AS completedAt, t.created_at AS createdAt,
      t.assigned_by_user_id AS assignedByUserId, u.display_name AS assignedByName
      FROM tasks t JOIN users u ON u.id = t.assigned_by_user_id WHERE t.child_id = ?`;
    const params = [req.child.id];
    if (bounds) { sql += ' AND t.due_at >= ? AND t.due_at < ?'; params.push(bounds.startDate, bounds.endDate); }
    if (req.query.assignedBy === 'me') { sql += ' AND t.assigned_by_user_id = ?'; params.push(req.user.id); }
    sql += ' ORDER BY t.due_at ASC, t.id ASC';
    res.json({ tasks: db.prepare(sql).all(...params) });
  });
  app.post('/api/children/:childId/tasks', auth, edit, (req, res) => {
    const title = requiredString(req.body?.title, 'title');
    const description = requiredString(req.body?.description, 'description', 1000);
    const developmentArea = choice(req.body?.developmentArea, AREAS, 'developmentArea');
    const dueAt = validDateOnly(req.body?.dueAt, 'dueAt');
    const now = new Date().toISOString();
    const result = db.prepare(`INSERT INTO tasks
      (child_id, assigned_by_user_id, title, description, development_area, due_at, status, completed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?)`).run(req.child.id, req.user.id, title, description, developmentArea, dueAt, now);
    return res.status(201).json({ task: {
      id: Number(result.lastInsertRowid), childId: req.child.id, assignedByUserId: req.user.id,
      assignedByName: req.user.display_name, title, description, developmentArea, dueAt,
      status: 'pending', completedAt: null, createdAt: now
    } });
  });
  app.patch('/api/tasks/:taskId/completion', auth, requireRole('child'), (req, res) => {
    const id = Number(req.params.taskId);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(404).json({ error: 'Task not found' });
    if (req.body?.completed !== true) return res.status(400).json({ error: 'completed must be true' });
    const task = db.prepare(`SELECT t.id, t.child_id AS childId, t.status, c.user_id AS childUserId
      FROM tasks t JOIN children c ON c.id = t.child_id WHERE t.id = ?`).get(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.childUserId !== req.user.id) return res.status(403).json({ error: 'Cannot complete another child\'s task' });
    if (task.status === 'pending') {
      db.prepare("UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?")
        .run(new Date().toISOString(), id);
    }
    const updated = db.prepare('SELECT id, status, completed_at AS completedAt FROM tasks WHERE id = ?').get(id);
    return res.json({ task: updated });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }));
  app.use((err, _req, res, _next) => {
    if (err.status === 400 || err.status === 403 || err.status === 404) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
    console.error('Unhandled API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}
module.exports = { createApp };
