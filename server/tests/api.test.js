'use strict';
process.env.JWT_SECRET = 'test_only_this_secret_is_at_least_32_characters_long';
const request = require('supertest');
const { DatabaseSync } = require('node:sqlite');
const { initSchema } = require('../src/db');
const { seedDemo } = require('../src/fixtures');
const { mondayUTC } = require('../src/validation');
const { createApp } = require('../src/app');

let db, app, week;
beforeEach(() => {
  db = new DatabaseSync(':memory:');
  initSchema(db);
  seedDemo(db, new Date('2026-11-18T08:00:00.000Z'));
  week = mondayUTC(new Date('2026-11-18T08:00:00.000Z'));
  app = createApp(db);
});
afterEach(() => db.close());
async function token(email) {
  const response = await request(app).post('/api/auth/login').send({ email, password: 'Demo1234!' });
  expect(response.status).toBe(200);
  return response.body.token;
}
function auth(t) { return { Authorization: `Bearer ${t}` }; }

describe('M1 — email/password login and account-derived roles', () => {
  test('public health reports v0.1', async () => {
    const result = await request(app).get('/api/health');
    expect(result.status).toBe(200);
    expect(result.body.release).toBe('v0.1');
  });
  test.each([
    ['parent@demo.test', 'parent'], ['teacher@demo.test', 'specialist'], ['child@demo.test', 'child']
  ])('login returns the stored %s role', async (email, role) => {
    const result = await request(app).post('/api/auth/login').send({ email, password: 'Demo1234!', role: 'parent' });
    expect(result.status).toBe(200);
    expect(result.body.user.role).toBe(role);
    expect(result.body.user.password_hash).toBeUndefined();
    const me = await request(app).get('/api/auth/me').set(auth(result.body.token));
    expect(me.body.user.role).toBe(role);
  });
  test('invalid password, nonexistent email and missing fields do not log in', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'parent@demo.test', password: 'wrong' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'notregistered@demo.test', password: 'Demo1234!' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'parent@demo.test' })).status).toBe(400);
  });
  test('authentication and role guards protect routes', async () => {
    expect((await request(app).get('/api/children')).status).toBe(401);
    expect((await request(app).get('/api/children').set(auth('invalid'))).status).toBe(401);
    const child = await token('child@demo.test');
    expect((await request(app).get('/api/children').set(auth(child))).status).toBe(403);
    expect((await request(app).get('/api/child/me').set(auth(child))).body.child.id).toBe(1);
    const parent = await token('parent@demo.test');
    expect((await request(app).get('/api/child/me').set(auth(parent))).status).toBe(403);
  });
});

describe('M2 — registered specialist linking, access and revocation', () => {
  test('parent can link and unlink doctor; stale JWT then has no child data access', async () => {
    const parent = await token('parent@demo.test');
    const doctor = await token('doctor@demo.test');
    const uri = '/api/children/1';
    expect((await request(app).get(`${uri}/events`).set(auth(doctor))).status).toBe(403);
    expect((await request(app).get(`${uri}/tasks`).set(auth(doctor))).status).toBe(403);
    const linked = await request(app).post(`${uri}/specialists`).set(auth(parent))
      .send({ email: 'doctor@demo.test', specialistType: 'doctor' });
    expect(linked.status).toBe(201);
    expect((await request(app).get(`${uri}/events`).set(auth(doctor))).status).toBe(200);
    expect((await request(app).get(`${uri}/tasks`).set(auth(doctor))).status).toBe(200);
    expect((await request(app).get(`${uri}/specialists`).set(auth(parent))).body.specialists).toHaveLength(2);
    expect((await request(app).delete(`${uri}/specialists/4`).set(auth(parent))).status).toBe(204);
    // Old token is still valid, but the link row was removed and must be checked on every call.
    expect((await request(app).get(`${uri}/events`).set(auth(doctor))).status).toBe(403);
    expect((await request(app).get(`${uri}/tasks`).set(auth(doctor))).status).toBe(403);
    expect((await request(app).post(`${uri}/events`).set(auth(doctor)).send({
      title: 'Illegal', startsAt: '2026-11-18T10:00:00Z', endsAt: '2026-11-18T11:00:00Z'
    })).status).toBe(403);
    expect((await request(app).get('/api/children').set(auth(doctor))).body.children).toHaveLength(0);
  });
  test('unregistered email errors; duplicate links rejected; no privilege for child or specialist', async () => {
    const parent = await token('parent@demo.test');
    const child = await token('child@demo.test');
    const specialist = await token('teacher@demo.test');
    const endpoint = '/api/children/1/specialists';
    expect((await request(app).post(endpoint).set(auth(parent)).send({ email: 'ghost@demo.test', specialistType: 'doctor' })).status).toBe(404);
    expect((await request(app).post(endpoint).set(auth(parent)).send({ email: 'teacher@demo.test', specialistType: 'teacher' })).status).toBe(409);
    expect((await request(app).post(endpoint).set(auth(parent)).send({ email: 'doctor@demo.test', specialistType: 'unknown' })).status).toBe(400);
    expect((await request(app).post(endpoint).set(auth(child)).send({ email: 'doctor@demo.test', specialistType: 'doctor' })).status).toBe(403);
    expect((await request(app).post(endpoint).set(auth(specialist)).send({ email: 'doctor@demo.test', specialistType: 'doctor' })).status).toBe(403);
    expect((await request(app).get(endpoint).set(auth(specialist))).status).toBe(403);
    expect((await request(app).delete(`${endpoint}/3`).set(auth(child))).status).toBe(403);
  });
  test('one parent cannot manage another parent’s child', async () => {
    const other = await token('otherparent@demo.test');
    expect((await request(app).get('/api/children/1/specialists').set(auth(other))).status).toBe(403);
    expect((await request(app).post('/api/children/1/specialists').set(auth(other)).send({ email: 'doctor@demo.test', specialistType: 'doctor' })).status).toBe(403);
    expect((await request(app).get('/api/children').set(auth(other))).body.children).toEqual([{ id: 2, displayName: 'Ada Example' }]);
  });
});

describe('M3 — weekly schedule', () => {
  const event = { title: 'Team meeting', description: 'Discuss weekly plan', startsAt: '2026-11-18T09:00:00Z', endsAt: '2026-11-18T10:00:00Z' };
  test('owning parent and linked specialist create events; child sees weekly list', async () => {
    const parent = await token('parent@demo.test');
    const teacher = await token('teacher@demo.test');
    const child = await token('child@demo.test');
    expect((await request(app).post('/api/children/1/events').set(auth(parent)).send(event)).status).toBe(201);
    expect((await request(app).post('/api/children/1/events').set(auth(teacher)).send({ ...event, title: 'Teacher event' })).status).toBe(201);
    const response = await request(app).get(`/api/children/1/events?weekStart=${week}`).set(auth(child));
    expect(response.status).toBe(200);
    expect(response.body.events.map(e => e.title)).toEqual(expect.arrayContaining(['Team meeting', 'Teacher event']));
    expect((await request(app).post('/api/children/1/events').set(auth(child)).send(event)).status).toBe(403);
    expect((await request(app).get('/api/children/2/events').set(auth(child))).status).toBe(403);
  });
  test('invalid date order and invalid weeks are rejected', async () => {
    const parent = await token('parent@demo.test');
    const uri = '/api/children/1/events';
    expect((await request(app).post(uri).set(auth(parent)).send({ ...event, endsAt: event.startsAt })).status).toBe(400);
    expect((await request(app).post(uri).set(auth(parent)).send({ ...event, startsAt: 'not a time' })).status).toBe(400);
    expect((await request(app).get(`${uri}?weekStart=2026-11-17`).set(auth(parent))).status).toBe(400);
    expect((await request(app).get(`${uri}?weekStart=2026-11-23`).set(auth(parent))).body.events).toHaveLength(0);
  });
});

describe('M4 — assignment and child completion', () => {
  const task = { title: 'Exercise with shapes', description: 'Draw two squares.', developmentArea: 'motor', dueAt: '2026-11-20' };
  test('parent assigns, child completes, parent and assigner see completion', async () => {
    const parent = await token('parent@demo.test');
    const child = await token('child@demo.test');
    const creation = await request(app).post('/api/children/1/tasks').set(auth(parent)).send(task);
    expect(creation.status).toBe(201);
    const id = creation.body.task.id;
    const before = await request(app).get(`/api/children/1/tasks?weekStart=${week}`).set(auth(child));
    expect(before.body.tasks.find(t => t.id === id).status).toBe('pending');
    const done = await request(app).patch(`/api/tasks/${id}/completion`).set(auth(child)).send({ completed: true });
    expect(done.status).toBe(200);
    expect(done.body.task.status).toBe('completed');
    expect(done.body.task.completedAt).toBeTruthy();
    const assigner = await request(app).get(`/api/children/1/tasks?weekStart=${week}&assignedBy=me`).set(auth(parent));
    expect(assigner.body.tasks.find(t => t.id === id).status).toBe('completed');
    const second = await request(app).patch(`/api/tasks/${id}/completion`).set(auth(child)).send({ completed: true });
    expect(second.body.task.completedAt).toBe(done.body.task.completedAt);
  });
  test('linked specialist assigns and sees own tasks', async () => {
    const teacher = await token('teacher@demo.test');
    const result = await request(app).post('/api/children/1/tasks').set(auth(teacher)).send(task);
    expect(result.status).toBe(201);
    const mine = await request(app).get('/api/children/1/tasks?assignedBy=me').set(auth(teacher));
    expect(mine.body.tasks.every(t => t.assignedByUserId === 3)).toBe(true);
    expect(mine.body.tasks.some(t => t.id === result.body.task.id)).toBe(true);
  });
  test('parent cannot complete, child cannot assign, another child cannot complete', async () => {
    const parent = await token('parent@demo.test');
    const child = await token('child@demo.test');
    const otherChild = await token('otherchild@demo.test');
    expect((await request(app).patch('/api/tasks/1/completion').set(auth(parent)).send({ completed: true })).status).toBe(403);
    expect((await request(app).post('/api/children/1/tasks').set(auth(child)).send(task)).status).toBe(403);
    expect((await request(app).patch('/api/tasks/1/completion').set(auth(otherChild)).send({ completed: true })).status).toBe(403);
    expect((await request(app).patch('/api/tasks/1/completion').set(auth(child)).send({ completed: false })).status).toBe(400);
    expect((await request(app).get('/api/children/1/tasks').set(auth(otherChild))).status).toBe(403);
  });
  test('task validation rejects bad fields and week filter', async () => {
    const parent = await token('parent@demo.test');
    expect((await request(app).post('/api/children/1/tasks').set(auth(parent)).send({ ...task, developmentArea: 'bad' })).status).toBe(400);
    expect((await request(app).post('/api/children/1/tasks').set(auth(parent)).send({ ...task, title: ' ' })).status).toBe(400);
    expect((await request(app).get('/api/children/1/tasks?weekStart=2026-11-17').set(auth(parent))).status).toBe(400);
  });
});
